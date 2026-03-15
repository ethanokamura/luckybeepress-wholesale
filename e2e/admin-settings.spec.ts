import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("Admin Settings", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/settings");
  });

  test("settings page loads with heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /platform settings/i, level: 1 }),
    ).toBeVisible();
  });

  test("back to dashboard link is visible", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: /back to dashboard/i }),
    ).toBeVisible();
  });

  test("shipping rate field exists", async ({ page }) => {
    await expect(page.getByText("Shipping Rate (cents)")).toBeVisible();
    const input = page.locator("#shipping_rate");
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute("type", "number");
  });

  test("new customer minimum field exists", async ({ page }) => {
    await expect(
      page.getByText("New Customer Minimum (cents)"),
    ).toBeVisible();
    const input = page.locator("#new_customer_minimum");
    await expect(input).toBeVisible();
  });

  test("returning customer minimum field exists", async ({ page }) => {
    await expect(
      page.getByText("Returning Customer Minimum (cents)"),
    ).toBeVisible();
    const input = page.locator("#returning_customer_minimum");
    await expect(input).toBeVisible();
  });

  test("featured limit field exists", async ({ page }) => {
    await expect(page.getByText("Featured Limit")).toBeVisible();
    const input = page.locator("#featured_limit");
    await expect(input).toBeVisible();
  });

  test("at-risk threshold field exists", async ({ page }) => {
    await expect(page.getByText("At-Risk Threshold (days)")).toBeVisible();
    const input = page.locator("#at_risk_threshold_days");
    await expect(input).toBeVisible();
  });

  test("reorder email delay field exists", async ({ page }) => {
    await expect(page.getByText("Reorder Email Delay (days)")).toBeVisible();
    const input = page.locator("#reorder_email_delay_days");
    await expect(input).toBeVisible();
  });

  test("net 30 threshold field exists", async ({ page }) => {
    await expect(page.getByText("Net 30 Threshold (cents)")).toBeVisible();
    const input = page.locator("#net30_threshold");
    await expect(input).toBeVisible();
  });

  test("admin notification email field exists", async ({ page }) => {
    await expect(page.getByText("Admin Notification Email")).toBeVisible();
    const input = page.locator("#admin_notification_email");
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute("type", "email");
  });

  test("save settings button exists", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /save settings/i }),
    ).toBeVisible();
  });

  test("each field has a description", async ({ page }) => {
    await expect(
      page.getByText("Flat-rate shipping cost in cents"),
    ).toBeVisible();
    await expect(
      page.getByText("Minimum order total for first-time customers"),
    ).toBeVisible();
    await expect(
      page.getByText("Minimum order total for returning customers"),
    ).toBeVisible();
    await expect(
      page.getByText("Maximum number of featured products"),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Days since last order before a customer is considered at risk",
      ),
    ).toBeVisible();
    await expect(
      page.getByText("Days after delivery to send reorder reminder"),
    ).toBeVisible();
    await expect(
      page.getByText("Minimum lifetime spend to qualify for Net 30"),
    ).toBeVisible();
    await expect(
      page.getByText("Email address for admin notifications"),
    ).toBeVisible();
  });

  test("settings fields accept input", async ({ page }) => {
    const shippingInput = page.locator("#shipping_rate");
    await shippingInput.fill("1500");
    await expect(shippingInput).toHaveValue("1500");
  });

  test("back to dashboard link navigates to /admin", async ({ page }) => {
    await page.getByRole("link", { name: /back to dashboard/i }).click();
    await page.waitForURL(/\/admin$/);
    await expect(
      page.getByRole("heading", { name: /dashboard/i }),
    ).toBeVisible();
  });
});
