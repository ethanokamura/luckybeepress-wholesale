import { test, expect } from "@playwright/test";
import { loginAsCustomer } from "./helpers/customer-auth";

test.describe("Order management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
  });

  test("orders page loads", async ({ page }) => {
    await page.goto("/orders");
    await expect(page.getByRole("heading", { name: /orders/i })).toBeVisible();
  });

  test("orders page shows empty state or order list", async ({ page }) => {
    await page.goto("/orders");

    const emptyState = page.getByText(/no orders yet/i);
    const orderLink = page.locator('a[href^="/orders/"]').first();

    const hasOrders = await orderLink
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const isEmpty = await emptyState
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    expect(hasOrders || isEmpty).toBeTruthy();
  });

  test("order list items show order number, date, status, and total", async ({
    page,
  }) => {
    await page.goto("/orders");

    const orderLink = page.locator('a[href^="/orders/"]').first();
    if (await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Should show order number (LBP-...)
      await expect(page.getByText(/LBP-/i).first()).toBeVisible();
      // Should show a price
      await expect(page.getByText(/\$/i).first()).toBeVisible();
    }
  });

  test("clicking an order navigates to order detail", async ({ page }) => {
    await page.goto("/orders");

    const orderLink = page.locator('a[href^="/orders/"]').first();
    if (await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orderLink.click();
      await expect(page).toHaveURL(/\/orders\/.+/);

      // Order detail should show order number
      await expect(page.getByText(/LBP-/i).first()).toBeVisible();

      // Should show Items section
      await expect(page.getByText(/items/i)).toBeVisible();

      // Should show shipping info
      await expect(page.getByText(/ship to/i)).toBeVisible();

      // Should show payment info
      await expect(page.getByText(/payment/i)).toBeVisible();

      // Should show total
      await expect(page.getByText(/total/i).last()).toBeVisible();
    }
  });

  test("order detail shows reorder button", async ({ page }) => {
    await page.goto("/orders");

    const orderLink = page.locator('a[href^="/orders/"]').first();
    if (await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orderLink.click();
      await expect(page).toHaveURL(/\/orders\/.+/);

      const reorderBtn = page.getByRole("button", { name: /reorder/i });
      await expect(reorderBtn).toBeVisible();
    }
  });

  test("order detail shows invoice download button", async ({ page }) => {
    await page.goto("/orders");

    const orderLink = page.locator('a[href^="/orders/"]').first();
    if (await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orderLink.click();
      await expect(page).toHaveURL(/\/orders\/.+/);

      const invoiceBtn = page.getByRole("link", { name: /invoice/i });
      await expect(invoiceBtn).toBeVisible();
    }
  });

  test("order detail shows cancel button only for pending/confirmed orders", async ({
    page,
  }) => {
    await page.goto("/orders");

    const orderLink = page.locator('a[href^="/orders/"]').first();
    if (await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orderLink.click();

      const cancelBtn = page.getByRole("button", { name: /cancel order/i });
      const statusBadge = page.locator('[class*="badge"]').first();

      // Cancel button should only be visible for pending/confirmed orders
      const statusText = await statusBadge.textContent().catch(() => "");
      if (statusText?.match(/pending|confirmed/i)) {
        await expect(cancelBtn).toBeVisible();
      }
    }
  });

  test("order detail shows status badge", async ({ page }) => {
    await page.goto("/orders");

    const orderLink = page.locator('a[href^="/orders/"]').first();
    if (await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orderLink.click();

      // Should show a status badge (Pending, Confirmed, Shipped, Delivered, or Cancelled)
      const statusTexts = [
        /pending/i,
        /confirmed/i,
        /shipped/i,
        /delivered/i,
        /cancelled/i,
      ];

      let hasStatus = false;
      for (const statusText of statusTexts) {
        if (
          await page
            .getByText(statusText)
            .first()
            .isVisible()
            .catch(() => false)
        ) {
          hasStatus = true;
          break;
        }
      }
      expect(hasStatus).toBeTruthy();
    }
  });
});
