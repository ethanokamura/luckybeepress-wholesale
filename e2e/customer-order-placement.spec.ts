import { test, expect } from "@playwright/test";
import {
  loginAsCustomer,
  loginAsNet30Customer,
  loginAsPendingCustomer,
} from "./helpers/customer-auth";
import { loginAsAdmin } from "./helpers/auth";

/**
 * End-to-end order placement tests.
 *
 * Uses dedicated test accounts:
 * - Basic customer: credit card orders
 * - Net 30 customer: Net 30 invoice orders (stays on-site, fully testable)
 * - Pending customer: verifies access gates
 * - Admin: verifies orders appear in admin
 */

/** Navigate directly to a product and add to cart. Increase qty for higher value. */
async function addProductToCart(
  page: import("@playwright/test").Page,
  productIndex: number,
  extraClicks = 4,
): Promise<boolean> {
  await page.goto("/catalog");
  await expect(page.getByRole("heading", { name: /catalog/i })).toBeVisible({
    timeout: 30000,
  });

  const cards = page.locator('a[href^="/catalog/"]');
  await expect(cards.first()).toBeVisible({ timeout: 15000 });

  const count = await cards.count();
  if (productIndex >= count) return false;

  const href = await cards.nth(productIndex).getAttribute("href");
  if (!href) return false;

  await page.goto(href);

  const addBtn = page.getByRole("button", { name: /add to cart/i });
  if (!(await addBtn.isVisible({ timeout: 30000 }).catch(() => false)))
    return false;

  // Increase quantity (each click adds 6 singles = $18)
  const increaseBtn = page.getByLabel(/increase quantity/i);
  if (await increaseBtn.isVisible().catch(() => false)) {
    for (let j = 0; j < extraClicks; j++) {
      await increaseBtn.click();
      await page.waitForTimeout(200);
    }
  }

  await addBtn.click();
  await expect(page.getByText(/added to cart/i)).toBeVisible({
    timeout: 15000,
  });
  return true;
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

/** Fill cart above minimum ($150 new, $100 returning). */
async function fillCartToMinimum(page: import("@playwright/test").Page) {
  let added = 0;
  for (let i = 0; i < 8 && added < 3; i++) {
    if (await addProductToCart(page, i)) added++;
  }
  return added;
}

// ─── Credit card order ──────────────────────────────────────────

test.describe("Credit card order placement", () => {
  test.setTimeout(120000);

  test("place order and verify it exists", async ({ page }) => {
    await loginAsCustomer(page);
    await clearCart(page);

    const added = await fillCartToMinimum(page);
    expect(added).toBeGreaterThan(0);

    await page.goto("/cart");
    await expect(page.getByText(/order summary/i)).toBeVisible({
      timeout: 10000,
    });

    // Check above minimum
    const belowMin = await page
      .getByText(/more to meet/i)
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (belowMin) {
      test.skip(true, "Could not reach order minimum");
      return;
    }

    // Credit card is default — place order
    const placeOrderBtn = page.getByRole("button", { name: /place order/i });
    await expect(placeOrderBtn).toBeEnabled();

    const notesField = page.getByLabel(/order notes/i);
    if (await notesField.isVisible().catch(() => false)) {
      await notesField.fill("E2E test — credit card");
    }

    await placeOrderBtn.click();

    // Redirects to Stripe checkout — order is already created in DB
    await page.waitForURL(
      (url) =>
        url.hostname.includes("stripe.com") ||
        url.pathname.includes("/orders/"),
      { timeout: 30000 },
    );

    // Navigate back and verify order exists
    await page.goto("/orders");
    await expect(page.getByText(/LBP-/).first()).toBeVisible({
      timeout: 15000,
    });
  });
});

// ─── Net 30 order ───────────────────────────────────────────────

test.describe("Net 30 order placement", () => {
  test.setTimeout(120000);

  test("place Net 30 order end-to-end", async ({ page }) => {
    await loginAsNet30Customer(page);
    await clearCart(page);

    const added = await fillCartToMinimum(page);
    expect(added).toBeGreaterThan(0);

    await page.goto("/cart");
    await expect(page.getByText(/order summary/i)).toBeVisible({
      timeout: 10000,
    });

    // Net 30 should be available for this customer
    const net30Label = page.getByText(/net 30/i);
    await expect(net30Label).toBeVisible({ timeout: 10000 });

    // Check above minimum
    const belowMin = await page
      .getByText(/more to meet/i)
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (belowMin) {
      test.skip(true, "Could not reach order minimum");
      return;
    }

    // Select Net 30
    await net30Label.click();

    const notesField = page.getByLabel(/order notes/i);
    if (await notesField.isVisible().catch(() => false)) {
      await notesField.fill("E2E test — Net 30");
    }

    const placeOrderBtn = page.getByRole("button", { name: /place order/i });
    await expect(placeOrderBtn).toBeEnabled();
    await placeOrderBtn.click();

    // Net 30 stays on-site — redirects to order detail
    await page.waitForURL(/\/orders\//, { timeout: 30000 });

    // Verify order detail
    await expect(page.getByText(/LBP-/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/subtotal/i)).toBeVisible();
    await expect(page.getByText(/total/i).last()).toBeVisible();
    await expect(page.getByText(/net 30/i).first()).toBeVisible();
  });
});

// ─── Order verification ─────────────────────────────────────────

test.describe("Order verification", () => {
  test("orders appear in customer history", async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/orders");

    const orderLink = page.locator('a[href^="/orders/"]').first();
    if (!(await orderLink.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, "No orders found — run placement tests first");
      return;
    }

    await expect(page.getByText(/LBP-/).first()).toBeVisible();
    await orderLink.click();
    await expect(page).toHaveURL(/\/orders\/.+/);
    await expect(page.getByText(/subtotal/i)).toBeVisible();
  });

  test("orders appear in admin dashboard", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/orders");
    await expect(page.getByText(/LBP-/).first()).toBeVisible({
      timeout: 15000,
    });
  });
});

// ─── Access control ─────────────────────────────────────────────

test.describe("Access control", () => {
  test("pending customer cannot access catalog", async ({ page }) => {
    // NOTE: This test requires NEXTAUTH_URL to match the test port.
    // When running on a different port than .env.local's NEXTAUTH_URL,
    // NextAuth redirects to the wrong host after login.
    await loginAsPendingCustomer(page);

    // After login, pending customer should NOT see the catalog
    // They get redirected to /approval-pending by the shop layout
    await page.goto("/catalog");
    await page.waitForURL(
      (url) => !url.pathname.endsWith("/catalog"),
      { timeout: 10000 },
    ).catch(() => {});

    const finalUrl = page.url();
    // Should be on approval-pending or login, NOT catalog
    expect(
      finalUrl.includes("approval-pending") || finalUrl.includes("login"),
    ).toBe(true);
  });

  test("checkout is blocked when below minimum", async ({ page }) => {
    await loginAsCustomer(page);
    await clearCart(page);

    // Add just one product at minimum quantity ($18, well below $150)
    const added = await addProductToCart(page, 0, 0); // no extra clicks = 6 singles = $18
    if (!added) {
      test.skip(true, "First product unavailable");
      return;
    }

    await page.goto("/cart");
    await expect(page.getByText(/order summary/i)).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByText(/more to meet/i)).toBeVisible({
      timeout: 5000,
    });

    const placeOrderBtn = page.getByRole("button", { name: /place order/i });
    await expect(placeOrderBtn).toBeDisabled();
  });

  test("basic customer does not see Net 30 option", async ({ page }) => {
    await loginAsCustomer(page);

    // Add a product so the checkout form renders
    await addProductToCart(page, 0);
    await page.goto("/cart");
    await expect(page.getByText(/order summary/i)).toBeVisible({
      timeout: 10000,
    });

    // Credit card should be visible
    await expect(page.getByText(/credit card/i)).toBeVisible();

    // Net 30 should NOT be visible
    const net30 = page.getByText(/net 30/i);
    await expect(net30).not.toBeVisible();
  });
});
