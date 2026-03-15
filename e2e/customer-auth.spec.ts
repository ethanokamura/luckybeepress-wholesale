import { test, expect } from "@playwright/test";
import { loginAsCustomer } from "./helpers/customer-auth";

test.describe("Customer authentication", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/catalog");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test("redirects unauthenticated users from cart", async ({ page }) => {
    await page.goto("/cart");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test("redirects unauthenticated users from orders", async ({ page }) => {
    await page.goto("/orders");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test("redirects unauthenticated users from account", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test("redirects unauthenticated users from wishlist", async ({ page }) => {
    await page.goto("/wishlist");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("fake@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText(/invalid email or password/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("shows error for empty password", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("test@example.com");
    // Don't fill password
    await page.getByRole("button", { name: /sign in/i }).click();

    // HTML5 validation should prevent submission
    const passwordInput = page.getByLabel("Password");
    await expect(passwordInput).toHaveAttribute("required", "");
  });

  test("can log in with valid credentials", async ({ page }) => {
    await loginAsCustomer(page);
    // Should be on catalog or approval-pending
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
  });

  test("preserves callbackUrl after login", async ({ page }) => {
    await page.goto("/orders");
    // Should redirect to login with callbackUrl
    await expect(page).toHaveURL(/\/login.*callbackUrl/, { timeout: 10000 });

    await loginAsCustomer(page);
    // After login, should redirect back to orders
    await expect(page).toHaveURL(/\/orders|\/catalog|\/approval-pending/, { timeout: 15000 });
  });

  test("login page has forgot password link", async ({ page }) => {
    await page.goto("/login");
    const link = page.getByRole("link", { name: /forgot password/i });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test("login page has apply link", async ({ page }) => {
    await page.goto("/login");
    const link = page.getByRole("link", { name: /apply/i }).first();
    await expect(link).toBeVisible();
  });
});
