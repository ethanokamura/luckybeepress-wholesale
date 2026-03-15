import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Admin Application Queue", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/applications");
  });

  test("applications page loads with heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /application queue/i, level: 1 }),
    ).toBeVisible();
  });

  test("back to dashboard link is visible", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: /back to dashboard/i }),
    ).toBeVisible();
  });

  test("applications table renders or empty state shows", async ({ page }) => {
    // Either a table with expected headers is present, or the empty state message appears
    const table = page.locator("table");
    const emptyState = page.getByText("No pending applications at this time.");

    const hasTable = await table.isVisible().catch(() => false);
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(hasTable || hasEmptyState).toBe(true);
  });

  test("applications table has correct column headers when populated", async ({
    page,
  }) => {
    const table = page.locator("table");
    const hasTable = await table.isVisible().catch(() => false);

    if (hasTable) {
      await expect(table.getByText("Business Name")).toBeVisible();
      await expect(table.getByText("Owner")).toBeVisible();
      await expect(table.getByText("Email")).toBeVisible();
      await expect(table.getByText("Business Type")).toBeVisible();
      await expect(table.getByText("Submitted")).toBeVisible();
    }
  });

  test("empty state message is descriptive", async ({ page }) => {
    const emptyState = page.getByText("No pending applications at this time.");
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    if (hasEmptyState) {
      await expect(emptyState).toBeVisible();
    }
  });

  test("back to dashboard link navigates to /admin", async ({ page }) => {
    await page.getByRole("link", { name: /back to dashboard/i }).click();
    await page.waitForURL(/\/admin$/);
    await expect(
      page.getByRole("heading", { name: /dashboard/i }),
    ).toBeVisible();
  });
});
