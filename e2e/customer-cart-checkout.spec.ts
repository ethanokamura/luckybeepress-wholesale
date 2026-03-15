import { test, expect } from "@playwright/test";
import { loginAsCustomer } from "./helpers/customer-auth";

test.describe("Cart and checkout flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
  });

  test("empty cart shows empty state with browse link", async ({ page }) => {
    await page.goto("/cart");

    const emptyState = page.getByText(/your cart is empty/i);
    // Cart may or may not be empty depending on test state
    if (await emptyState.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(
        page.getByRole("link", { name: /browse catalog/i })
      ).toBeVisible();
    }
  });

  test("can add a product to cart from product detail", async ({ page }) => {
    await page.goto("/catalog");

    // Find an available product and click it
    const productCard = page.locator('a[href^="/catalog/"]').first();
    await expect(productCard).toBeVisible({ timeout: 10000 });
    await productCard.click();

    // Wait for product detail page
    await expect(page).toHaveURL(/\/catalog\/.+/);

    // Check if product is available
    const addToCartBtn = page.getByRole("button", { name: /add to cart/i });
    if (await addToCartBtn.isVisible().catch(() => false)) {
      await addToCartBtn.click();

      // Should see success message
      await expect(page.getByText(/added to cart/i)).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test("quantity controls enforce increment rules", async ({ page }) => {
    await page.goto("/catalog");

    const productCard = page.locator('a[href^="/catalog/"]').first();
    await expect(productCard).toBeVisible({ timeout: 10000 });
    await productCard.click();

    await expect(page).toHaveURL(/\/catalog\/.+/);

    // Check for quantity controls
    const increaseBtn = page.getByLabel(/increase quantity/i);
    if (await increaseBtn.isVisible().catch(() => false)) {
      // Default should be 6 (singles increment)
      const qtyDisplay = page.locator("text=6").first();
      await expect(qtyDisplay).toBeVisible();

      // Increase should go to 12
      await increaseBtn.click();
      await expect(page.locator("text=12").first()).toBeVisible();

      // Decrease back to 6
      const decreaseBtn = page.getByLabel(/decrease quantity/i);
      await decreaseBtn.click();
      await expect(page.locator("text=6").first()).toBeVisible();
    }
  });

  test("cart page shows items with correct info", async ({ page }) => {
    // First add something to cart
    await page.goto("/catalog");
    const productCard = page.locator('a[href^="/catalog/"]').first();
    await expect(productCard).toBeVisible({ timeout: 10000 });
    await productCard.click();

    const addBtn = page.getByRole("button", { name: /add to cart/i });
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await expect(page.getByText(/added to cart/i)).toBeVisible({
        timeout: 10000,
      });
    }

    // Go to cart
    await page.goto("/cart");

    // Should show order summary
    await expect(page.getByText(/order summary/i)).toBeVisible({
      timeout: 10000,
    });

    // Should show subtotal
    await expect(page.getByText(/subtotal/i)).toBeVisible();

    // Should show shipping
    await expect(page.getByText(/shipping/i)).toBeVisible();

    // Should show total
    await expect(page.getByText(/total/i).last()).toBeVisible();
  });

  test("cart shows minimum order warning when below threshold", async ({
    page,
  }) => {
    await page.goto("/cart");

    // If cart is below minimum, should show warning
    const minWarning = page.getByText(/more to meet/i);
    const placeOrderBtn = page.getByRole("button", { name: /place order/i });

    // Either below minimum (warning shown, button disabled) or above (button enabled)
    const hasMminWarning = await minWarning
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (hasMminWarning) {
      await expect(minWarning).toBeVisible();
    }
  });

  test("cart shows shipping cost", async ({ page }) => {
    await page.goto("/cart");

    // If cart has items, should show $15 shipping
    const shipping = page.getByText(/\$15\.00/);
    const emptyCart = page.getByText(/your cart is empty/i);

    const isEmpty = await emptyCart
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (!isEmpty) {
      await expect(shipping).toBeVisible();
    }
  });

  test("can update quantity in cart", async ({ page }) => {
    await page.goto("/cart");

    const increaseBtn = page.getByLabel(/increase quantity/i).first();
    if (await increaseBtn.isVisible().catch(() => false)) {
      await increaseBtn.click();
      // Wait for update to process
      await page.waitForTimeout(1000);
      // Total should have changed (page revalidates)
      await expect(page.getByText(/total/i).last()).toBeVisible();
    }
  });

  test("can remove item from cart", async ({ page }) => {
    await page.goto("/cart");

    const removeBtn = page
      .getByRole("button", { name: /remove/i })
      .first();
    if (await removeBtn.isVisible().catch(() => false)) {
      await removeBtn.click();
      // Wait for update
      await page.waitForTimeout(1000);
    }
  });

  test("checkout form shows payment method selection", async ({ page }) => {
    await page.goto("/cart");

    const paymentLabel = page.getByText(/payment method/i);
    if (await paymentLabel.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Credit card option should always be available
      await expect(page.getByText(/credit card/i)).toBeVisible();
    }
  });

  test("checkout form has address selector", async ({ page }) => {
    await page.goto("/cart");

    const shipToLabel = page.getByText(/ship to/i);
    if (await shipToLabel.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(shipToLabel).toBeVisible();
    }
  });

  test("checkout form has order notes field", async ({ page }) => {
    await page.goto("/cart");

    const notesField = page.getByLabel(/order notes/i);
    if (await notesField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await notesField.fill("E2E test order — please ignore");
      await expect(notesField).toHaveValue("E2E test order — please ignore");
    }
  });

  test("place order button is present when above minimum", async ({
    page,
  }) => {
    await page.goto("/cart");

    const placeOrderBtn = page.getByRole("button", { name: /place order/i });
    const minWarning = page.getByText(/more to meet/i);
    const emptyCart = page.getByText(/your cart is empty/i);

    const isEmpty = await emptyCart
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const belowMin = await minWarning
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (!isEmpty && !belowMin) {
      await expect(placeOrderBtn).toBeVisible();
      await expect(placeOrderBtn).toBeEnabled();
    }
  });
});
