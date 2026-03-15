import { test, expect } from "@playwright/test";

test.describe("Public pages (no auth required)", () => {
  test("homepage loads with hero and CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading").first()).toBeVisible();

    // Should have Browse Catalog and Apply CTAs
    await expect(
      page.getByRole("link", { name: /browse catalog/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /apply/i }).first()
    ).toBeVisible();
  });

  test("homepage shows brand story", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/lucky bee press/i).first()).toBeVisible();
    await expect(page.getByText(/laurie/i).first()).toBeVisible();
  });

  test("wholesale page loads with program info", async ({ page }) => {
    await page.goto("/wholesale");
    await expect(
      page.getByRole("heading", { name: /wholesale program/i })
    ).toBeVisible();

    // Should show pricing info
    await expect(page.getByText(/\$3\.00/)).toBeVisible();
    await expect(page.getByText(/\$11\.00/)).toBeVisible();

    // Should have apply CTA
    await expect(
      page.getByRole("link", { name: /apply/i }).first()
    ).toBeVisible();
  });

  test("apply page loads with form", async ({ page }) => {
    await page.goto("/apply");
    await expect(
      page.getByRole("heading", { name: /apply/i })
    ).toBeVisible();

    // Should have business info fields
    await expect(page.getByLabel(/business name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();

    // Should have submit button
    await expect(
      page.getByRole("button", { name: /submit/i })
    ).toBeVisible();
  });

  test("apply form validates required fields", async ({ page }) => {
    await page.goto("/apply");

    // Try to submit empty form — HTML5 validation should block it
    const submitBtn = page.getByRole("button", { name: /submit/i });
    await submitBtn.click();

    // Should still be on apply page
    await expect(page).toHaveURL(/\/apply/);
  });

  test("contact page loads", async ({ page }) => {
    await page.goto("/contact");
    await expect(
      page.getByRole("heading", { name: /contact us/i })
    ).toBeVisible();
    await expect(page.getByText(/luckybeepress@gmail.com/).first()).toBeVisible();
  });

  test("privacy page loads", async ({ page }) => {
    await page.goto("/privacy");
    await expect(
      page.getByRole("heading", { name: /privacy/i })
    ).toBeVisible();
  });

  test("terms page loads", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: /terms/i }).first()).toBeVisible();
  });

  test("forgot password page loads", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(
      page.getByRole("heading", { name: /reset password/i })
    ).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test("navigation links work from homepage", async ({ page }) => {
    await page.goto("/");

    // Wholesale link
    await page.getByRole("link", { name: /wholesale program/i }).click();
    await expect(page).toHaveURL(/\/wholesale/);

    // Back to home
    await page.goto("/");

    // Apply link
    await page.getByRole("link", { name: /apply/i }).first().click();
    await expect(page).toHaveURL(/\/apply/);
  });

  test("footer links work", async ({ page }) => {
    await page.goto("/");

    // Contact
    await page.getByRole("link", { name: /contact/i }).click();
    await expect(page).toHaveURL(/\/contact/);

    await page.goto("/");

    // Privacy
    await page.getByRole("link", { name: /privacy/i }).click();
    await expect(page).toHaveURL(/\/privacy/);

    await page.goto("/");

    // Terms
    await page.getByRole("link", { name: /terms/i }).click();
    await expect(page).toHaveURL(/\/terms/);
  });
});
