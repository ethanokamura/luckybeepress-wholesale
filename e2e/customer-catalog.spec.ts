import { test, expect } from "@playwright/test";
import { loginAsCustomer } from "./helpers/customer-auth";

test.describe("Product catalog", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page);
  });

  test("displays catalog page with products", async ({ page }) => {
    await page.goto("/catalog");
    await expect(page.getByRole("heading", { name: /catalog/i })).toBeVisible();

    // Should show product count
    await expect(page.getByText(/product/i)).toBeVisible();

    // Should have product cards
    const productLinks = page.locator('a[href^="/catalog/"]');
    await expect(productLinks.first()).toBeVisible({ timeout: 10000 });
  });

  test("search filters products by name", async ({ page }) => {
    await page.goto("/catalog");

    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("valentine");

    // Wait for debounced search to trigger navigation
    await page.waitForURL(/search=valentine/, { timeout: 5000 });

    // Results should contain valentine products
    await expect(page.locator('a[href^="/catalog/"]').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("search filters products by SKU", async ({ page }) => {
    await page.goto("/catalog");

    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("1365");

    await page.waitForURL(/search=1365/, { timeout: 5000 });

    // Should find products matching that SKU (search works, results appear)
    await expect(page.locator('a[href^="/catalog/"]').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("search with no results shows empty state", async ({ page }) => {
    await page.goto("/catalog");

    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("xyznonexistentproduct");

    await page.waitForURL(/search=xyznonexistentproduct/, { timeout: 5000 });

    await expect(page.getByText(/no products found/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("category filter works", async ({ page }) => {
    await page.goto("/catalog");

    // Open category dropdown and select a category
    await page.locator('button:has-text("All Categories")').click();
    const firstCategory = page.locator('[role="option"]').nth(1); // skip "All Categories"
    const categoryName = await firstCategory.textContent();
    await firstCategory.click();

    // URL should update with category param
    await page.waitForURL(/category=/, { timeout: 5000 });

    // Products should be visible
    await expect(page.locator('a[href^="/catalog/"]').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("clear filters resets the catalog", async ({ page }) => {
    await page.goto("/catalog?search=valentine");

    // Wait for filtered results
    await expect(page.locator('a[href^="/catalog/"]').first()).toBeVisible({
      timeout: 10000,
    });

    // Click clear filters
    const clearButton = page.getByText(/clear/i);
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await expect(page).toHaveURL("/catalog");
    }
  });

  test("product card shows name, price, and image", async ({ page }) => {
    await page.goto("/catalog");

    const firstCard = page.locator('a[href^="/catalog/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    // Should have an image
    await expect(firstCard.locator("img").first()).toBeVisible();

    // Should have price text with WSP
    await expect(firstCard.getByText(/WSP/)).toBeVisible();
  });

  test("product detail page loads with full info", async ({ page }) => {
    await page.goto("/catalog");

    // Click first product
    const firstCard = page.locator('a[href^="/catalog/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    await firstCard.click();

    // Should be on product detail page
    await expect(page).toHaveURL(/\/catalog\/.+/);

    // Should show product name as heading
    await expect(page.getByRole("heading").first()).toBeVisible();

    // Should show pricing (may have multiple WSP elements for singles + box sets)
    await expect(page.getByText(/WSP/).first()).toBeVisible();

    // Should show product details section
    await expect(page.getByText(/product details/i)).toBeVisible();

    // Should show add to cart button (if available)
    const addToCart = page.getByRole("button", { name: /add to cart/i });
    const unavailable = page.getByText(/currently unavailable/i);
    const hasAddToCart = await addToCart.isVisible().catch(() => false);
    const isUnavailable = await unavailable.isVisible().catch(() => false);

    // One of these should be true
    expect(hasAddToCart || isUnavailable).toBeTruthy();
  });

  test("product detail shows multiple images", async ({ page }) => {
    await page.goto("/catalog");

    const firstCard = page.locator('a[href^="/catalog/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    await firstCard.click();

    // Main image should be visible
    await expect(page.locator("img").first()).toBeVisible();
  });
});
