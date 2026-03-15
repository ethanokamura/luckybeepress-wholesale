import { type Page, type BrowserContext } from "@playwright/test";

/**
 * Logs in as an admin user by navigating to the login page,
 * filling in credentials from environment variables, and submitting.
 *
 * Requires ADMIN_EMAIL and ADMIN_PASSWORD environment variables to be set.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be set to run admin E2E tests.",
    );
  }

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait for navigation away from the login page
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 30_000,
  });
}

/**
 * Sets a mock NextAuth session cookie on the browser context.
 * This can be used as an alternative to loginAsAdmin when you want to
 * bypass the login flow and set the session directly.
 *
 * The cookie value should be a valid JWT session token.
 * Set the SESSION_TOKEN environment variable to use this helper.
 */
export async function setupAuthCookie(context: BrowserContext): Promise<void> {
  const sessionToken = process.env.SESSION_TOKEN;

  if (!sessionToken) {
    throw new Error(
      "SESSION_TOKEN environment variable must be set to use setupAuthCookie.",
    );
  }

  const baseURL = process.env.BASE_URL || "http://localhost:3000";
  const url = new URL(baseURL);

  await context.addCookies([
    {
      name: "authjs.session-token",
      value: sessionToken,
      domain: url.hostname,
      path: "/",
      httpOnly: true,
      secure: url.protocol === "https:",
      sameSite: "Lax",
    },
  ]);
}
