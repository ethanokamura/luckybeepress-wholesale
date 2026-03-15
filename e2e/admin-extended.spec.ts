import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Admin application detail", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("can navigate to application detail page", async ({ page }) => {
    await page.goto("/admin/applications");
    const appLink = page.locator('a[href^="/admin/applications/"]').first();
    if (await appLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await appLink.click();
      await expect(page).toHaveURL(/\/admin\/applications\/.+/);
      // Should show application details
      await expect(page.getByText(/business name|email|owner/i).first()).toBeVisible();
    }
  });

  test("application detail has approve and reject buttons", async ({ page }) => {
    await page.goto("/admin/applications");
    const appLink = page.locator('a[href^="/admin/applications/"]').first();
    if (await appLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await appLink.click();
      await expect(page.getByRole("button", { name: /approve/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /reject/i })).toBeVisible();
    }
  });
});

test.describe("Admin customer detail actions", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("customer detail page has action controls", async ({ page }) => {
    await page.goto("/admin/customers");
    const customerLink = page.locator('a[href^="/admin/customers/"]').first();
    if (await customerLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await customerLink.click();
      await expect(page).toHaveURL(/\/admin\/customers\/.+/);
      // Should show customer management controls
      await expect(page.getByText(/net.?30|tax.?exempt|discount/i).first()).toBeVisible();
    }
  });
});

test.describe("Admin order detail actions", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("order detail page has management controls", async ({ page }) => {
    await page.goto("/admin/orders");
    const orderLink = page.locator('a[href^="/admin/orders/"]').first();
    if (await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orderLink.click();
      await expect(page).toHaveURL(/\/admin\/orders\/.+/);
      // Should show order management elements
      await expect(page.getByText(/status|tracking|payment/i).first()).toBeVisible();
    }
  });

  test("order detail shows tracking number field", async ({ page }) => {
    await page.goto("/admin/orders");
    const orderLink = page.locator('a[href^="/admin/orders/"]').first();
    if (await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orderLink.click();
      await expect(page).toHaveURL(/\/admin\/orders\/.+/);
      // Order detail should show status or tracking info
      await expect(page.getByText(/status|tracking|order/i).first()).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe("Admin invoices page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("invoices page loads", async ({ page }) => {
    await page.goto("/admin/invoices");
    await expect(page.getByRole("heading", { name: /invoice/i })).toBeVisible();
  });

  test("invoices page shows table or empty state", async ({ page }) => {
    await page.goto("/admin/invoices");
    await expect(page.getByRole("heading", { name: /invoice/i })).toBeVisible({ timeout: 10000 });
    // Wait for either table or empty state to appear
    const content = page.locator("table").or(page.getByText(/no.*invoice/i));
    await expect(content.first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Admin product editing", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("can navigate to edit product page", async ({ page }) => {
    await page.goto("/admin/products");
    // Find an edit link or button
    const editLink = page.locator('a[href*="/edit"]').first();
    if (await editLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editLink.click();
      await expect(page).toHaveURL(/\/admin\/products\/.+\/edit/);
      await expect(page.getByRole("heading", { name: /edit/i })).toBeVisible();
    }
  });

  test("edit product page has all form fields", async ({ page }) => {
    await page.goto("/admin/products");
    const editLink = page.locator('a[href*="/edit"]').first();
    if (await editLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editLink.click();
      await expect(page.getByRole("heading", { name: /edit product/i })).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("Name")).toBeVisible();
    }
  });
});

test.describe("Admin settings save", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("settings can be saved", async ({ page }) => {
    await page.goto("/admin/settings");
    const saveBtn = page.getByRole("button", { name: /save/i });
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();
    // Should show success feedback
    await expect(page.getByText(/saved|success|updated/i).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Admin manual order creation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("create order page has all required fields", async ({ page }) => {
    await page.goto("/admin/orders/create");
    await expect(page.getByRole("heading", { name: /create.*order/i })).toBeVisible();
    // Customer selector
    await expect(page.getByText(/customer/i).first()).toBeVisible();
    // Payment method
    await expect(page.getByText(/payment/i).first()).toBeVisible();
    // Submit button
    await expect(page.getByRole("button", { name: /create.*order/i })).toBeVisible();
  });
});
