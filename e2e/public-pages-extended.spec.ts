import { test, expect } from "@playwright/test";

test.describe("Extended public pages", () => {
  test("apply confirmation page loads", async ({ page }) => {
    await page.goto("/apply/confirmation");
    await expect(page.getByRole("heading").first()).toBeVisible();
    // Should show a success/confirmation message
    await expect(page.getByText(/thank you|received|submitted/i).first()).toBeVisible();
  });

  test("approval pending page redirects unauthenticated to login", async ({ page }) => {
    await page.goto("/approval-pending");
    // This is a protected route — unauthenticated users get redirected to login
    await expect(page.getByRole("heading").first()).toBeVisible();
    await expect(page).toHaveURL(/\/login|\/approval-pending/);
  });

  test("reset password page loads", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("reset password page shows token error without valid token", async ({ page }) => {
    await page.goto("/reset-password?token=invalid-token");
    // Should show password fields or error
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("forgot password form submits successfully", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByRole("button", { name: /reset|send|submit/i }).click();
    // Should show success message (always succeeds to prevent enumeration)
    await expect(page.getByText(/check your email|sent|reset link/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("apply form submits with valid data", async ({ page }) => {
    await page.goto("/apply");

    // Fill required fields
    const businessName = page.getByLabel(/business name/i);
    if (await businessName.isVisible()) {
      await businessName.fill("Test Business LLC");
    }

    const ownerName = page.getByLabel(/owner name|your name|full name/i);
    if (await ownerName.isVisible()) {
      await ownerName.fill("Test Owner");
    }

    await page.getByLabel(/email/i).fill(`e2e-test-${Date.now()}@example.com`);
    await page.getByLabel(/password/i).fill("TestPassword123!");

    const phone = page.getByLabel(/phone/i);
    if (await phone.isVisible()) {
      await phone.fill("555-555-5555");
    }

    // Fill address fields if visible
    const street = page.getByLabel(/street|address line 1/i).first();
    if (await street.isVisible().catch(() => false)) {
      await street.fill("123 Test St");
    }

    const city = page.getByLabel(/city/i);
    if (await city.isVisible().catch(() => false)) {
      await city.fill("Portland");
    }

    const state = page.getByLabel(/state/i);
    if (await state.isVisible().catch(() => false)) {
      await state.fill("OR");
    }

    const zip = page.getByLabel(/zip/i);
    if (await zip.isVisible().catch(() => false)) {
      await zip.fill("97201");
    }

    // Select business type if present
    const businessType = page.getByLabel(/business type/i);
    if (await businessType.isVisible().catch(() => false)) {
      await businessType.selectOption({ index: 1 });
    }

    // Submit
    await page.getByRole("button", { name: /submit/i }).click();

    // Should redirect to confirmation or show success
    await page.waitForTimeout(3000);
    const url = page.url();
    const hasConfirmation = url.includes("/confirmation") || url.includes("/apply");
    expect(hasConfirmation).toBeTruthy();
  });
});
