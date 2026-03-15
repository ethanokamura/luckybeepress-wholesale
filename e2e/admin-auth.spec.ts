import { test, expect } from "@playwright/test";

test.describe("Admin Authentication & Route Protection", () => {
  test("unauthenticated user visiting /admin is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/admin");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated user visiting /admin/orders is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/admin/orders");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated user visiting /admin/customers is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/admin/customers");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated user visiting /admin/products is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/admin/products");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated user visiting /admin/settings is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/admin/settings");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("login page renders with email and password fields", async ({
    page,
  }) => {
    await page.goto("/login");

    // Heading
    await expect(page.getByRole("heading", { name: /welcome back|sign in/i })).toBeVisible();

    // Email field
    const emailInput = page.getByLabel("Email");
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute("type", "email");
    await expect(emailInput).toHaveAttribute("required", "");

    // Password field
    const passwordInput = page.getByLabel("Password");
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute("type", "password");
    await expect(passwordInput).toHaveAttribute("required", "");

    // Submit button
    await expect(
      page.getByRole("button", { name: /sign in/i }),
    ).toBeVisible();

    // Links
    await expect(page.getByRole("link", { name: /forgot password/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /apply for wholesale access/i }),
    ).toBeVisible();
  });

  test("login page shows sign-in description text", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByText("Sign in to your wholesale account"),
    ).toBeVisible();
  });
});
