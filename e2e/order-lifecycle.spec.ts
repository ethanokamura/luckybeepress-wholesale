import { test, expect } from "@playwright/test";
import {
  loginAsCustomer,
  loginAsNet30Customer,
} from "./helpers/customer-auth";
import { loginAsAdmin } from "./helpers/auth";

/**
 * Full order lifecycle: place → confirm → ship → deliver
 *
 * Uses the test DB via NEXT_PUBLIC_TEST_MODE flag.
 * Places a real Net 30 order (stays on-site), then walks through
 * the admin workflow to ship and deliver it.
 */

/** Add products to cart above the order minimum. */
async function fillCartToMinimum(page: import("@playwright/test").Page) {
  await page.goto("/catalog");
  await expect(page.getByRole("heading", { name: /catalog/i })).toBeVisible({
    timeout: 30000,
  });

  const cards = page.locator('a[href^="/catalog/"]');
  await expect(cards.first()).toBeVisible({ timeout: 15000 });

  let added = 0;
  const count = await cards.count();

  for (let i = 0; i < Math.min(count, 8) && added < 3; i++) {
    await page.goto("/catalog");
    await expect(cards.nth(i)).toBeVisible({ timeout: 10000 });
    const href = await cards.nth(i).getAttribute("href");
    if (!href) continue;

    await page.goto(href);
    const addBtn = page.getByRole("button", { name: /add to cart/i });
    if (!(await addBtn.isVisible({ timeout: 30000 }).catch(() => false))) continue;

    // Increase quantity: 6 → 30 singles ($90 per product)
    const increaseBtn = page.getByLabel(/increase quantity/i);
    if (await increaseBtn.isVisible().catch(() => false)) {
      for (let j = 0; j < 4; j++) {
        await increaseBtn.click();
        await page.waitForTimeout(200);
      }
    }

    await addBtn.click();
    await expect(page.getByText(/added to cart/i)).toBeVisible({ timeout: 15000 });
    added++;
  }
  return added;
}

/** Clear all items from cart. */
async function clearCart(page: import("@playwright/test").Page) {
  await page.goto("/cart");
  await page.waitForTimeout(1000);
  for (let i = 0; i < 20; i++) {
    const btn = page.getByRole("button", { name: /remove/i }).first();
    if (!(await btn.isVisible({ timeout: 2000 }).catch(() => false))) break;
    await btn.click();
    await page.waitForTimeout(1000);
  }
}

test.describe.serial("Order lifecycle — place to delivered", () => {
  test.setTimeout(180000);

  let orderNumber: string;
  let orderId: string;

  test("1. customer places a Net 30 order", async ({ page }) => {
    await loginAsNet30Customer(page);
    await clearCart(page);

    const added = await fillCartToMinimum(page);
    expect(added).toBeGreaterThan(0);

    await page.goto("/cart");
    await expect(page.getByText(/order summary/i)).toBeVisible({ timeout: 10000 });

    // Verify above minimum
    const belowMin = await page
      .getByText(/more to meet/i)
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    if (belowMin) {
      test.skip(true, "Could not reach order minimum");
      return;
    }

    // Select Net 30
    const net30Label = page.getByText(/net 30/i);
    await expect(net30Label).toBeVisible({ timeout: 10000 });
    await net30Label.click();

    // Place order
    const placeOrderBtn = page.getByRole("button", { name: /place order/i });
    await expect(placeOrderBtn).toBeEnabled();
    await placeOrderBtn.click();

    // Net 30 redirects to order detail page
    await page.waitForURL(/\/orders\//, { timeout: 30000 });

    // Capture order number and ID from the URL
    orderId = page.url().split("/orders/")[1]?.split("?")[0] ?? "";
    expect(orderId).toBeTruthy();

    const orderNumEl = page.getByText(/LBP-/);
    await expect(orderNumEl).toBeVisible({ timeout: 10000 });
    orderNumber = (await orderNumEl.textContent()) ?? "";
    expect(orderNumber).toMatch(/^LBP-/);

    // Verify order detail
    await expect(page.getByText(/pending/i).first()).toBeVisible();
    await expect(page.getByText(/net 30/i).first()).toBeVisible();
  });

  test("2. admin sees the order and ships it", async ({ page }) => {
    // If previous test didn't set orderId, find the latest order
    await loginAsAdmin(page);

    if (!orderId) {
      await page.goto("/admin/orders");
      const firstOrderLink = page.locator('a[href*="/admin/orders/"]').first();
      await expect(firstOrderLink).toBeVisible({ timeout: 15000 });
      const href = await firstOrderLink.getAttribute("href");
      orderId = href?.split("/admin/orders/")[1] ?? "";
    }

    // Navigate to order detail
    await page.goto(`/admin/orders/${orderId}`);
    await expect(page.getByText(/LBP-/).first()).toBeVisible({ timeout: 15000 });

    // Order should be pending
    await expect(page.getByText(/pending/i).first()).toBeVisible();

    // Enter tracking number and ship
    const trackingInput = page.getByPlaceholder(/tracking number/i);
    await expect(trackingInput).toBeVisible();
    await trackingInput.fill("TEST-TRACK-12345");

    const shipBtn = page.getByRole("button", { name: /ship/i }).first();
    await expect(shipBtn).toBeEnabled();
    await shipBtn.click();

    // Wait for success message
    await expect(page.getByText(/tracking number set/i)).toBeVisible({
      timeout: 15000,
    });
  });

  test("3. admin marks order as delivered", async ({ page }) => {
    await loginAsAdmin(page);

    expect(orderId).toBeTruthy();
    await page.goto(`/admin/orders/${orderId}`);
    await expect(page.getByText(/LBP-/).first()).toBeVisible({ timeout: 15000 });

    // Order should be shipped now
    await expect(page.getByText(/shipped/i).first()).toBeVisible();

    // Click Mark Delivered
    const deliveredBtn = page.getByRole("button", { name: /mark delivered/i });
    await expect(deliveredBtn).toBeVisible();
    await deliveredBtn.click();

    // Wait for success
    await expect(page.getByText(/marked as delivered/i)).toBeVisible({
      timeout: 15000,
    });
  });

  test("4. customer sees delivered status", async ({ page }) => {
    await loginAsNet30Customer(page);

    await page.goto("/orders");
    await expect(page.getByText(/LBP-/).first()).toBeVisible({ timeout: 15000 });

    // Find the delivered order and click it
    const orderLink = page.locator('a[href^="/orders/"]').first();
    await orderLink.click();
    await expect(page).toHaveURL(/\/orders\/.+/);

    // Should show delivered status
    await expect(page.getByText(/delivered/i).first()).toBeVisible();

    // Should show tracking number
    await expect(page.getByText(/TEST-TRACK-12345/)).toBeVisible();
  });

  test("5. invoice can be downloaded for delivered order", async ({ page }) => {
    await loginAsNet30Customer(page);

    expect(orderId).toBeTruthy();
    await page.goto(`/orders/${orderId}`);
    await expect(page.getByText(/LBP-/).first()).toBeVisible({ timeout: 15000 });

    // Click Invoice PDF download link
    const invoiceLink = page.getByRole("link", { name: /invoice/i });
    await expect(invoiceLink).toBeVisible();

    // Trigger download and verify response
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 15000 }),
      invoiceLink.click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^Invoice-LBP-/);
  });
});
