import { type Page } from "@playwright/test";

/**
 * Logs in as the basic approved customer.
 * Requires E2E_CUSTOMER_EMAIL and E2E_CUSTOMER_PASSWORD env vars.
 */
export async function loginAsCustomer(page: Page): Promise<void> {
  const email = process.env.E2E_CUSTOMER_EMAIL;
  const password = process.env.E2E_CUSTOMER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "E2E_CUSTOMER_EMAIL and E2E_CUSTOMER_PASSWORD environment variables must be set."
    );
  }

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 15000,
  });
}

/**
 * Logs in as the Net 30 eligible customer.
 * Requires E2E_NET30_CUSTOMER_EMAIL and E2E_NET30_CUSTOMER_PASSWORD env vars.
 */
export async function loginAsNet30Customer(page: Page): Promise<void> {
  const email = process.env.E2E_NET30_CUSTOMER_EMAIL;
  const password = process.env.E2E_NET30_CUSTOMER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "E2E_NET30_CUSTOMER_EMAIL and E2E_NET30_CUSTOMER_PASSWORD environment variables must be set."
    );
  }

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 15000,
  });
}

/**
 * Logs in as the pending (non-approved) customer.
 * Requires E2E_PENDING_CUSTOMER_EMAIL and E2E_PENDING_CUSTOMER_PASSWORD env vars.
 */
export async function loginAsPendingCustomer(page: Page): Promise<void> {
  const email = process.env.E2E_PENDING_CUSTOMER_EMAIL;
  const password = process.env.E2E_PENDING_CUSTOMER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "E2E_PENDING_CUSTOMER_EMAIL and E2E_PENDING_CUSTOMER_PASSWORD environment variables must be set."
    );
  }

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Pending customers should be redirected to approval-pending, not login
  await page.waitForURL(
    (url) => !url.pathname.includes("/login"),
    { timeout: 15000 }
  );
}
