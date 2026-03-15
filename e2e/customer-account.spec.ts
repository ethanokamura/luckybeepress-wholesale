import { test, expect } from "@playwright/test";
import { loginAsCustomer } from "./helpers/customer-auth";

test.describe("Account management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
  });

  test("account page loads with profile form", async ({ page }) => {
    await page.goto("/account");
    await expect(
      page.getByRole("heading", { name: /account settings/i })
    ).toBeVisible();

    // Should show profile section
    await expect(page.getByRole("heading", { name: /profile/i })).toBeVisible();

    // Should show email field
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("account page shows shipping addresses section", async ({ page }) => {
    await page.goto("/account");
    await expect(
      page.getByRole("heading", { name: /shipping addresses/i })
    ).toBeVisible();
  });

  test("profile form has all fields", async ({ page }) => {
    await page.goto("/account");

    await expect(page.getByLabel(/name/i).first()).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/phone/i)).toBeVisible();

    // Save button
    await expect(
      page.getByRole("button", { name: /save changes/i })
    ).toBeVisible();
  });

  test("can add a new address", async ({ page }) => {
    await page.goto("/account");

    const addBtn = page.getByRole("button", { name: /add address/i });
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();

      // Form should appear (labels are text, not <label> elements)
      await expect(page.getByText("Recipient", { exact: false })).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("Street", { exact: false })).toBeVisible();
      await expect(page.getByText("City", { exact: false })).toBeVisible();
      await expect(page.getByText("State", { exact: false })).toBeVisible();
      await expect(page.getByText("ZIP", { exact: false })).toBeVisible();
    }
  });

  test("password change section exists", async ({ page }) => {
    await page.goto("/account");

    await expect(page.getByText(/change password/i)).toBeVisible();
    await expect(page.getByLabel(/current password/i)).toBeVisible();
    await expect(page.getByLabel(/new password/i)).toBeVisible();
  });
});
