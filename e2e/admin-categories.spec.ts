import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Admin Category Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/categories");
  });

  test("categories page loads with heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /categories/i, level: 1 }),
    ).toBeVisible();
  });

  test("create category input exists", async ({ page }) => {
    const newCategoryInput = page.getByPlaceholder("New category name...");
    await expect(newCategoryInput).toBeVisible();
  });

  test("add category button exists", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /add category/i }),
    ).toBeVisible();
  });

  test("add category button is disabled when input is empty", async ({
    page,
  }) => {
    const addButton = page.getByRole("button", { name: /add category/i });
    await expect(addButton).toBeDisabled();
  });

  test("add category button becomes enabled when text is entered", async ({
    page,
  }) => {
    const input = page.getByPlaceholder("New category name...");
    await input.fill("Test Category");

    const addButton = page.getByRole("button", { name: /add category/i });
    await expect(addButton).toBeEnabled();
  });

  test("category list renders or shows empty state", async ({ page }) => {
    // Wait for either category list or empty state to appear
    const content = page.locator(".divide-y").or(page.getByText("No categories yet."));
    await expect(content.first()).toBeVisible({ timeout: 15000 });
  });

  test("categories show product count", async ({ page }) => {
    // Wait for content to load (skeleton disappears)
    await page.waitForTimeout(3000);

    const emptyState = page.getByText("No categories yet.");
    const hasEmpty = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasEmpty) {
      const productCounts = page.getByText(/\d+ products?/);
      await expect(productCounts.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test("categories have rename and delete actions when present", async ({
    page,
  }) => {
    const emptyState = page.getByText("No categories yet.");
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    if (!hasEmpty) {
      await expect(page.getByText("Rename").first()).toBeVisible();
      await expect(page.getByText("Delete").first()).toBeVisible();
    }
  });

  test("categories have reorder buttons when present", async ({ page }) => {
    const emptyState = page.getByText("No categories yet.");
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    if (!hasEmpty) {
      await expect(
        page.getByRole("button", { name: /move up/i }).first(),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /move down/i }).first(),
      ).toBeVisible();
    }
  });
});
