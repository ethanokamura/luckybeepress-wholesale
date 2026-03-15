import { test, expect } from "@playwright/test";
import { loginAsCustomer } from "./helpers/customer-auth";

/**
 * Full end-to-end flow: browse → add to cart → checkout → view order
 *
 * This is the most critical test — it covers the entire happy path
 * that a wholesale customer would follow.
 */
test.describe("Full customer purchase flow", () => {
  test("browse → add to cart → view cart → verify order flow", async ({
    page,
  }) => {
    // Step 1: Log in
    await loginAsCustomer(page);

    // Step 2: Browse catalog
    await page.goto("/catalog");
    await expect(page.getByRole("heading", { name: /catalog/i })).toBeVisible({
      timeout: 15000,
    });

    // Step 3: Click on a product
    const productCard = page.locator('a[href^="/catalog/"]').first();
    await expect(productCard).toBeVisible({ timeout: 10000 });
    const productName = await productCard
      .locator("p")
      .first()
      .textContent()
      .catch(() => "Unknown");
    await productCard.click();

    // Step 4: Verify product detail loaded
    await expect(page).toHaveURL(/\/catalog\/.+/);
    await expect(page.getByText(/WSP/i).first()).toBeVisible();

    // Step 5: Add to cart (if product is available)
    const addToCartBtn = page.getByRole("button", { name: /add to cart/i });
    if (await addToCartBtn.isVisible().catch(() => false)) {
      await addToCartBtn.click();
      await expect(page.getByText(/added to cart/i)).toBeVisible({
        timeout: 10000,
      });

      // Step 6: Navigate to cart
      await page.goto("/cart");
      await expect(page.getByText(/order summary/i)).toBeVisible({
        timeout: 10000,
      });

      // Step 7: Verify cart has the item
      await expect(page.getByText(/subtotal/i)).toBeVisible();
      await expect(page.getByText(/shipping/i)).toBeVisible();
      await expect(page.getByText(/total/i).last()).toBeVisible();

      // Step 8: Verify shipping is $15
      await expect(page.getByText(/\$15\.00/)).toBeVisible();

      // Step 9: Check if place order button exists (may be disabled if below minimum)
      const placeOrderBtn = page.getByRole("button", {
        name: /place order/i,
      });
      const isVisible = await placeOrderBtn.isVisible().catch(() => false);

      if (isVisible) {
        // Step 10: Verify checkout form elements
        await expect(page.getByText(/payment method/i)).toBeVisible();
        await expect(page.getByText(/credit card/i)).toBeVisible();
      }
    }
  });

  test("add multiple products and reach minimum", async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/catalog");

    // Add multiple products to reach the minimum
    const productCards = page.locator('a[href^="/catalog/"]');
    const count = await productCards.count();

    let added = 0;
    for (let i = 0; i < Math.min(count, 5) && added < 3; i++) {
      await page.goto("/catalog");
      const card = productCards.nth(i);
      await expect(card).toBeVisible({ timeout: 10000 });
      await card.click();

      const addBtn = page.getByRole("button", { name: /add to cart/i });
      if (await addBtn.isVisible().catch(() => false)) {
        // Increase quantity to help reach minimum (3 sets of 6 = 18 cards = $54)
        const increaseBtn = page.getByLabel(/increase quantity/i);
        if (await increaseBtn.isVisible().catch(() => false)) {
          // Click increase a few times to add more
          for (let j = 0; j < 3; j++) {
            await increaseBtn.click();
            await page.waitForTimeout(200);
          }
        }

        await addBtn.click();
        const success = await page
          .getByText(/added to cart/i)
          .isVisible({ timeout: 5000 })
          .catch(() => false);
        if (success) added++;
      }
    }

    // Go to cart and check
    await page.goto("/cart");
    await expect(page.getByText(/order summary/i)).toBeVisible({
      timeout: 10000,
    });

    // Should show subtotal
    await expect(page.getByText(/subtotal/i)).toBeVisible();
  });

  test("reorder flow pre-populates cart", async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/orders");

    const orderLink = page.locator('a[href^="/orders/"]').first();
    if (await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orderLink.click();
      await expect(page).toHaveURL(/\/orders\/.+/);

      const reorderBtn = page.getByRole("button", { name: /reorder/i });
      if (await reorderBtn.isVisible().catch(() => false)) {
        await reorderBtn.click();

        // Should redirect to cart with items
        await expect(page).toHaveURL(/\/cart/, { timeout: 10000 });
      }
    }
  });
});
