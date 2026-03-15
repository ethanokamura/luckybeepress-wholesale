import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Admin Order Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/orders");
  });

  test("orders page loads with heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /orders/i, level: 1 }),
    ).toBeVisible();
  });

  test("status filter dropdown exists with correct options", async ({
    page,
  }) => {
    const statusSelect = page.locator("select[name='status']");
    await expect(statusSelect).toBeVisible();

    const options = statusSelect.locator("option");
    await expect(options.nth(0)).toHaveText("All Statuses");
    await expect(options.nth(1)).toHaveText("Pending");
    await expect(options.nth(2)).toHaveText("Confirmed");
    await expect(options.nth(3)).toHaveText("Shipped");
    await expect(options.nth(4)).toHaveText("Delivered");
    await expect(options.nth(5)).toHaveText("Cancelled");
  });

  test("payment method filter dropdown exists with correct options", async ({
    page,
  }) => {
    const paymentSelect = page.locator("select[name='paymentMethod']");
    await expect(paymentSelect).toBeVisible();

    const options = paymentSelect.locator("option");
    await expect(options.nth(0)).toHaveText("All Methods");
    await expect(options.nth(1)).toHaveText("Credit Card");
    await expect(options.nth(2)).toHaveText("Net 30");
  });

  test("date range inputs exist", async ({ page }) => {
    const dateFromInput = page.locator("input[name='dateFrom']");
    const dateToInput = page.locator("input[name='dateTo']");

    await expect(dateFromInput).toBeVisible();
    await expect(dateToInput).toBeVisible();
    await expect(dateFromInput).toHaveAttribute("type", "date");
    await expect(dateToInput).toHaveAttribute("type", "date");
  });

  test("search input exists", async ({ page }) => {
    const searchInput = page.locator("input[name='search']");
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute(
      "placeholder",
      "Order # or customer...",
    );
  });

  test("filter and reset buttons exist", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /filter/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /reset/i }),
    ).toBeVisible();
  });

  test("create order link exists and navigates to /admin/orders/create", async ({
    page,
  }) => {
    const createLink = page.getByRole("link", { name: /create order/i });
    await expect(createLink).toBeVisible();

    await createLink.click();
    await page.waitForURL(/\/admin\/orders\/create/);
    await expect(
      page.getByRole("heading", { name: /create manual order/i }),
    ).toBeVisible();
  });

  test("filter form submits and updates URL", async ({ page }) => {
    const statusSelect = page.locator("select[name='status']");
    await statusSelect.selectOption("pending");

    await page.getByRole("button", { name: /filter/i }).click();

    await page.waitForURL(/status=pending/);
    expect(page.url()).toContain("status=pending");
  });

  test("status filter label is visible", async ({ page }) => {
    await expect(page.locator("label").filter({ hasText: "Status" })).toBeVisible();
  });

  test("payment filter label is visible", async ({ page }) => {
    await expect(page.locator("label").filter({ hasText: "Payment" }).first()).toBeVisible();
  });
});

test.describe("Admin Create Order Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/orders/create");
  });

  test("create order page loads with heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /create manual order/i, level: 1 }),
    ).toBeVisible();
  });

  test("customer dropdown is present", async ({ page }) => {
    const customerLabel = page.getByText("Customer", { exact: true });
    await expect(customerLabel).toBeVisible();

    const customerSelect = page.locator("select").first();
    await expect(customerSelect).toBeVisible();

    // First option should be placeholder
    const firstOption = customerSelect.locator("option").first();
    await expect(firstOption).toHaveText("Select a customer...");
  });

  test("product search input is present", async ({ page }) => {
    const productSearch = page.getByPlaceholder(
      "Search by name, SKU, or category...",
    );
    await expect(productSearch).toBeVisible();
  });

  test("payment method selector is present", async ({ page }) => {
    await expect(page.getByText("Payment Method")).toBeVisible();
  });

  test("notes textarea is present", async ({ page }) => {
    await expect(page.getByText("Notes (optional)")).toBeVisible();
  });

  test("totals section shows subtotal and shipping", async ({ page }) => {
    await expect(page.getByText("Subtotal")).toBeVisible();
    await expect(page.getByText("Shipping (flat)")).toBeVisible();
    await expect(page.getByText("Total", { exact: true })).toBeVisible();
  });

  test("create order submit button is present", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /create order/i }),
    ).toBeVisible();
  });
});
