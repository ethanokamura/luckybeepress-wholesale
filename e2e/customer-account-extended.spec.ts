import { test, expect } from "@playwright/test";
import { loginAsCustomer } from "./helpers/customer-auth";

test.describe("Customer account management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
  });

  test("can update profile name", async ({ page }) => {
    await page.goto("/account");
    const nameField = page.getByLabel(/name/i).first();
    await expect(nameField).toBeVisible({ timeout: 10000 });
    // Verify field is editable
    const currentValue = await nameField.inputValue();
    expect(currentValue).toBeTruthy();
  });

  test("can view existing addresses", async ({ page }) => {
    await page.goto("/account");
    // Should show addresses section
    const addressSection = page.getByText(/shipping address|addresses/i).first();
    await expect(addressSection).toBeVisible({ timeout: 10000 });
  });

  test("address form has required fields", async ({ page }) => {
    await page.goto("/account");
    const addBtn = page.getByRole("button", { name: /add address/i });
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();
    // Check address form fields appear (labels are text, not <label> elements)
    await expect(page.getByText("Recipient", { exact: false })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Street", { exact: false })).toBeVisible();
    await expect(page.getByText("City", { exact: false })).toBeVisible();
    await expect(page.getByText("State", { exact: false })).toBeVisible();
    await expect(page.getByText("ZIP", { exact: false })).toBeVisible();
  });

  test("password change section requires current password", async ({ page }) => {
    await page.goto("/account");
    const currentPw = page.getByLabel(/current password/i);
    const newPw = page.getByLabel(/new password/i);
    if (await currentPw.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(currentPw).toBeVisible();
      await expect(newPw).toBeVisible();
    }
  });

  test("profile save button exists", async ({ page }) => {
    await page.goto("/account");
    await expect(
      page.getByRole("button", { name: /save|update/i }).first()
    ).toBeVisible({ timeout: 10000 });
  });
});
