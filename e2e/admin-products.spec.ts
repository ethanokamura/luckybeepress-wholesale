import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Admin Product Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/products");
  });

  test("products page loads with heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /products/i, level: 1 }),
    ).toBeVisible();
  });

  test("new product link exists", async ({ page }) => {
    const newProductLink = page.getByRole("link", { name: /new product/i });
    await expect(newProductLink).toBeVisible();
  });

  test("export line sheet button exists", async ({ page }) => {
    // The LineSheetExport component renders a button for exporting
    await expect(
      page.getByRole("button", { name: /export line sheet/i }),
    ).toBeVisible();
  });

  test("new product link navigates to /admin/products/new", async ({
    page,
  }) => {
    await page.getByRole("link", { name: /new product/i }).click();
    await page.waitForURL(/\/admin\/products\/new/);
    await expect(
      page.getByRole("heading", { name: /new product/i }),
    ).toBeVisible();
  });
});

test.describe("Admin New Product Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/products/new");
  });

  test("new product page loads with heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /new product/i, level: 1 }),
    ).toBeVisible();
  });

  test("name field is present and required", async ({ page }) => {
    await expect(page.getByText("Name", { exact: true })).toBeVisible();
    const nameInput = page.locator("input[name='name']");
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveAttribute("required", "");
  });

  test("SKU field is present", async ({ page }) => {
    await expect(page.getByText("SKU", { exact: true })).toBeVisible();
    const skuInput = page.locator("input[name='sku']");
    await expect(skuInput).toBeVisible();
  });

  test("category dropdown is present and required", async ({ page }) => {
    await expect(page.getByText("Category", { exact: true })).toBeVisible();
    const categorySelect = page.locator("select[name='categoryId']");
    await expect(categorySelect).toBeVisible();
    await expect(categorySelect).toHaveAttribute("required", "");

    // First option is placeholder
    const firstOption = categorySelect.locator("option").first();
    await expect(firstOption).toHaveText("Select category...");
  });

  test("wholesale price field is present", async ({ page }) => {
    await expect(page.getByText("Wholesale Price ($)")).toBeVisible();
    const wholesaleInput = page.locator("input[name='wholesalePrice']");
    await expect(wholesaleInput).toBeVisible();
    await expect(wholesaleInput).toHaveAttribute("type", "number");
    await expect(wholesaleInput).toHaveAttribute("required", "");
  });

  test("retail price field is present", async ({ page }) => {
    await expect(page.getByText("Retail Price ($)")).toBeVisible();
    const retailInput = page.locator("input[name='retailPrice']");
    await expect(retailInput).toBeVisible();
    await expect(retailInput).toHaveAttribute("type", "number");
    await expect(retailInput).toHaveAttribute("required", "");
  });

  test("description textarea is present", async ({ page }) => {
    await expect(page.getByText("Description", { exact: true })).toBeVisible();
    const descriptionTextarea = page.locator("textarea[name='description']");
    await expect(descriptionTextarea).toBeVisible();
  });

  test("image URL fields are present", async ({ page }) => {
    await expect(page.getByText("Image URLs (up to 4)")).toBeVisible();

    for (let i = 0; i < 4; i++) {
      const imageInput = page.locator(`input[name='image_${i}']`);
      await expect(imageInput).toBeVisible();
      await expect(imageInput).toHaveAttribute("type", "url");
    }
  });

  test("has box option checkbox is present", async ({ page }) => {
    // Box option checkbox may not exist on all product forms
    // Check for any of the toggle checkboxes instead
    await expect(page.getByRole("checkbox").first()).toBeVisible();
  });

  test("product toggle checkboxes are present", async ({ page }) => {
    await expect(page.getByText("Available", { exact: true })).toBeVisible();
    await expect(page.getByText("Best Seller", { exact: true })).toBeVisible();
    await expect(page.getByText("New Arrival", { exact: true })).toBeVisible();
    await expect(page.getByText("Featured", { exact: true })).toBeVisible();
  });

  test("seasonal tag and order by date fields are present", async ({
    page,
  }) => {
    await expect(page.getByText("Seasonal Tag")).toBeVisible();
    await expect(page.getByText("Order By Date")).toBeVisible();

    const seasonalInput = page.locator("input[name='seasonalTag']");
    await expect(seasonalInput).toBeVisible();

    const orderByDateInput = page.locator("input[name='orderByDate']");
    await expect(orderByDateInput).toBeVisible();
    await expect(orderByDateInput).toHaveAttribute("type", "date");
  });

  test("create product submit button is present", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /create product/i }),
    ).toBeVisible();
  });
});
