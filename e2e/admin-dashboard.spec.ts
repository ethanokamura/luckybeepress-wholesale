import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Admin Dashboard Home", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");
  });

  test("dashboard page loads and shows heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /dashboard/i, level: 1 }),
    ).toBeVisible();
  });

  test("pending applications widget is visible", async ({ page }) => {
    await expect(page.getByText("Pending Applications")).toBeVisible();
    await expect(page.getByText("Awaiting review")).toBeVisible();
  });

  test("new orders widget is visible", async ({ page }) => {
    await expect(page.getByText("New Orders")).toBeVisible();
    await expect(page.getByText("Since last login")).toBeVisible();
  });

  test("overdue invoices widget is visible", async ({ page }) => {
    await expect(page.getByText("Overdue Invoices")).toBeVisible();
  });

  test("at-risk customers widget is visible", async ({ page }) => {
    await expect(page.getByText("At-Risk Customers")).toBeVisible();
  });

  test("30-day summary section is visible with metrics", async ({ page }) => {
    await expect(page.getByText("30-Day Summary")).toBeVisible();
    await expect(page.getByText("Orders").first()).toBeVisible();
    await expect(page.getByText("Revenue").first()).toBeVisible();
    await expect(page.getByText("New Accounts").first()).toBeVisible();
  });

  test("navigation sidebar contains links to all admin sections", async ({
    page,
  }) => {
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();

    const expectedLinks = [
      "Dashboard",
      "Applications",
      "Customers",
      "Orders",
      "Products",
      "Categories",
      "Invoices",
      "Analytics",
      "Settings",
    ];

    for (const label of expectedLinks) {
      await expect(sidebar.getByRole("link", { name: label })).toBeVisible();
    }
  });

  test("sidebar shows admin branding", async ({ page }) => {
    const sidebar = page.locator("aside");
    await expect(sidebar.getByText("Lucky Bee Press")).toBeVisible();
    await expect(sidebar.getByText("Admin Dashboard")).toBeVisible();
  });

  test("sidebar shows signed-in user info", async ({ page }) => {
    const sidebar = page.locator("aside");
    await expect(sidebar.getByText(/signed in as/i)).toBeVisible();
  });

  test("clicking Applications sidebar link navigates correctly", async ({
    page,
  }) => {
    await page.locator("aside").getByRole("link", { name: "Applications" }).click();
    await page.waitForURL(/\/admin\/applications/);
    await expect(
      page.getByRole("heading", { name: /application queue/i }),
    ).toBeVisible();
  });

  test("clicking Customers sidebar link navigates correctly", async ({
    page,
  }) => {
    await page.locator("aside").getByRole("link", { name: "Customers" }).click();
    await page.waitForURL(/\/admin\/customers/);
    await expect(
      page.getByRole("heading", { name: /customers/i }),
    ).toBeVisible();
  });

  test("clicking Orders sidebar link navigates correctly", async ({
    page,
  }) => {
    await page.locator("aside").getByRole("link", { name: "Orders" }).click();
    await page.waitForURL(/\/admin\/orders/);
    await expect(
      page.getByRole("heading", { name: /orders/i }),
    ).toBeVisible();
  });

  test("clicking Products sidebar link navigates correctly", async ({
    page,
  }) => {
    await page.locator("aside").getByRole("link", { name: "Products" }).click();
    await page.waitForURL(/\/admin\/products/);
    await expect(
      page.getByRole("heading", { name: /products/i }),
    ).toBeVisible();
  });

  test("clicking Settings sidebar link navigates correctly", async ({
    page,
  }) => {
    await page.locator("aside").getByRole("link", { name: "Settings" }).click();
    await page.waitForURL(/\/admin\/settings/);
    await expect(
      page.getByRole("heading", { name: /platform settings/i }),
    ).toBeVisible();
  });

  test("clicking Analytics sidebar link navigates correctly", async ({
    page,
  }) => {
    await page.locator("aside").getByRole("link", { name: "Analytics" }).click();
    await page.waitForURL(/\/admin\/analytics/);
    await expect(
      page.getByRole("heading", { name: /analytics/i }),
    ).toBeVisible();
  });

  test("pending applications widget links to applications page", async ({
    page,
  }) => {
    await page.getByRole("link", { name: /pending applications/i }).click();
    await page.waitForURL(/\/admin\/applications/);
  });

  test("new orders widget links to orders page", async ({ page }) => {
    await page.getByRole("link", { name: /new orders/i }).click();
    await page.waitForURL(/\/admin\/orders/);
  });
});
