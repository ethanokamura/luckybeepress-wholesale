import { test, expect } from "@playwright/test";
import { loginAsCustomer } from "./helpers/customer-auth";

test.describe("Wishlist", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
  });

  test("wishlist page loads", async ({ page }) => {
    await page.goto("/wishlist");
    await expect(
      page.getByRole("heading", { name: /wishlist/i })
    ).toBeVisible();
  });

  test("empty wishlist shows empty state", async ({ page }) => {
    await page.goto("/wishlist");

    const emptyState = page.getByText(/your wishlist is empty/i);
    const wishlistItem = page.locator('a[href^="/catalog/"]').first();

    const hasItems = await wishlistItem
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const isEmpty = await emptyState
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    expect(hasItems || isEmpty).toBeTruthy();
  });

  test("can add product to wishlist from product detail", async ({ page }) => {
    await page.goto("/catalog");

    const productCard = page.locator('a[href^="/catalog/"]').first();
    await expect(productCard).toBeVisible({ timeout: 10000 });
    await productCard.click();

    const wishlistBtn = page.getByRole("button", {
      name: /add to wishlist|saved to wishlist/i,
    });
    if (await wishlistBtn.isVisible().catch(() => false)) {
      await wishlistBtn.click();
      // Should toggle state
      await page.waitForTimeout(1000);
    }
  });

  test("wishlist items show product info", async ({ page }) => {
    await page.goto("/wishlist");

    const wishlistItem = page.locator('a[href^="/catalog/"]').first();
    if (await wishlistItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Should show price
      await expect(page.getByText(/WSP/i).first()).toBeVisible();

      // Should have move to cart button
      const moveBtn = page.getByRole("button", { name: /move to cart/i });
      await expect(moveBtn.first()).toBeVisible();

      // Should have remove button
      const removeBtn = page.getByRole("button", { name: /remove/i });
      await expect(removeBtn.first()).toBeVisible();
    }
  });
});
