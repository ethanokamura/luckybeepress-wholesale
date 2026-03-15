import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Admin Analytics & Reporting", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/analytics");
  });

  test("analytics page loads with heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /analytics & reporting/i, level: 1 }),
    ).toBeVisible();
  });

  test("revenue forecast section is visible", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /revenue forecast/i }),
    ).toBeVisible();
  });

  test("revenue forecast shows projection cards", async ({ page }) => {
    await expect(page.getByText("30-Day Projection")).toBeVisible();
    await expect(page.getByText("60-Day Projection")).toBeVisible();
    await expect(page.getByText("90-Day Projection")).toBeVisible();
  });

  test("revenue forecast shows customer metrics", async ({ page }) => {
    await expect(page.getByText("Active Customers")).toBeVisible();
    await expect(page.getByText("Returning Customers")).toBeVisible();
  });

  test("best sellers section is visible", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /best sellers/i }),
    ).toBeVisible();
  });

  test("best sellers table has correct headers", async ({ page }) => {
    const bestSellersSection = page
      .locator("section")
      .filter({ hasText: "Best Sellers" });

    await expect(bestSellersSection.getByText("Product")).toBeVisible();
    await expect(bestSellersSection.getByText("Units Sold")).toBeVisible();
    await expect(bestSellersSection.getByText("Revenue")).toBeVisible();
  });

  test("category performance section is visible", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /category performance/i }),
    ).toBeVisible();
  });

  test("category performance table has correct headers", async ({ page }) => {
    const categorySection = page
      .locator("section")
      .filter({ hasText: "Category Performance" });

    await expect(categorySection.getByRole("columnheader", { name: "Category" })).toBeVisible();
    await expect(categorySection.getByText("Units")).toBeVisible();
    await expect(categorySection.getByText("Revenue")).toBeVisible();
  });

  test("customer lifetime value section is visible", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /customer lifetime value/i }),
    ).toBeVisible();
  });

  test("customer lifetime value table has correct headers", async ({
    page,
  }) => {
    const clvSection = page
      .locator("section")
      .filter({ hasText: "Customer Lifetime Value" });

    await expect(clvSection.getByText("Business")).toBeVisible();
    await expect(clvSection.getByText("Contact")).toBeVisible();
    await expect(clvSection.getByText("Email")).toBeVisible();
    await expect(clvSection.getByText("Orders")).toBeVisible();
    await expect(clvSection.getByText("Total Spent")).toBeVisible();
  });

  test("at-risk customers section is visible", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /at-risk customers/i }),
    ).toBeVisible();
  });

  test("at-risk customers table has correct headers", async ({ page }) => {
    const atRiskSection = page
      .locator("section")
      .filter({ hasText: "At-Risk Customers" });

    await expect(atRiskSection.getByText("Business")).toBeVisible();
    await expect(atRiskSection.getByText("Contact")).toBeVisible();
    await expect(atRiskSection.getByText("Last Order")).toBeVisible();
  });

  test("seasonal trends section is visible", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /seasonal trends/i }),
    ).toBeVisible();
  });

  test("platform settings section is visible", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /platform settings/i }),
    ).toBeVisible();
  });

  test("platform settings table has correct headers", async ({ page }) => {
    const settingsSection = page
      .locator("section")
      .filter({ hasText: "Platform Settings" });

    await expect(settingsSection.getByText("Key")).toBeVisible();
    await expect(settingsSection.getByText("Value")).toBeVisible();
  });

  test("all report sections render without errors", async ({ page }) => {
    // Verify the page loaded fully by checking all section headings are present
    const expectedSections = [
      "Revenue Forecast",
      "Best Sellers",
      "Category Performance",
      "Customer Lifetime Value",
      "At-Risk Customers",
      "Seasonal Trends",
      "Platform Settings",
    ];

    for (const section of expectedSections) {
      await expect(
        page.getByRole("heading", { name: new RegExp(section, "i") }),
      ).toBeVisible();
    }
  });
});
