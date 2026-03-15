import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Admin Customer Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/customers");
  });

  test("customers page loads with heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /customers/i, level: 1 }),
    ).toBeVisible();
  });

  test("search input is visible and functional", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search by name or email...");
    await expect(searchInput).toBeVisible();

    // Type in the search box to verify it accepts input
    await searchInput.fill("test search");
    await expect(searchInput).toHaveValue("test search");
  });

  test("status filter dropdown exists with correct options", async ({
    page,
  }) => {
    const statusSelect = page.locator("select[name='status']");
    await expect(statusSelect).toBeVisible();

    // Verify all status options are available
    const options = statusSelect.locator("option");
    await expect(options).toHaveCount(5);

    await expect(options.nth(0)).toHaveText("All Statuses");
    await expect(options.nth(1)).toHaveText("Pending");
    await expect(options.nth(2)).toHaveText("Active");
    await expect(options.nth(3)).toHaveText("Rejected");
    await expect(options.nth(4)).toHaveText("Suspended");
  });

  test("filter button is visible", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /filter/i }),
    ).toBeVisible();
  });

  test("customer table renders or empty state shows", async ({ page }) => {
    // Wait for either table or empty state to appear
    const content = page.locator("table").or(page.getByText("No customers found."));
    await expect(content.first()).toBeVisible({ timeout: 15000 });
  });

  test("customer table has correct column headers when populated", async ({
    page,
  }) => {
    const table = page.locator("table");
    const hasTable = await table.isVisible().catch(() => false);

    if (hasTable) {
      await expect(table.getByText("Business Name")).toBeVisible();
      await expect(table.getByText("Owner")).toBeVisible();
      await expect(table.getByText("Email")).toBeVisible();
      await expect(table.getByText("Status")).toBeVisible();
      await expect(table.getByText("Net 30")).toBeVisible();
      await expect(table.getByText("Discount")).toBeVisible();
      await expect(table.getByText("Joined")).toBeVisible();
    }
  });

  test("clicking a customer navigates to detail page", async ({ page }) => {
    const customerLink = page.locator("table a").first();
    const hasCustomerLink = await customerLink.isVisible().catch(() => false);

    if (hasCustomerLink) {
      await customerLink.click();
      await page.waitForURL(/\/admin\/customers\/[a-zA-Z0-9-]+/);
      expect(page.url()).toMatch(/\/admin\/customers\/[a-zA-Z0-9-]+/);
    }
  });

  test("back to dashboard link is visible and navigates", async ({ page }) => {
    const backLink = page.getByRole("link", { name: /back to dashboard/i });
    await expect(backLink).toBeVisible();

    await backLink.click();
    await page.waitForURL(/\/admin$/);
  });

  test("filter form submits and updates URL with search params", async ({
    page,
  }) => {
    const searchInput = page.getByPlaceholder("Search by name or email...");
    await searchInput.fill("test");

    const statusSelect = page.locator("select[name='status']");
    await statusSelect.selectOption("active");

    await page.getByRole("button", { name: /filter/i }).click();

    await page.waitForURL(/search=test/);
    expect(page.url()).toContain("search=test");
    expect(page.url()).toContain("status=active");
  });
});
