import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load test env first (credentials, test DB URL, test mode flag)
const testEnv =
  dotenv.config({ path: path.resolve(__dirname, ".env.test.local") }).parsed ?? {};
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3003";
const port = Number(new URL(baseURL).port) || 3003;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: [["html"], ["list"]],
  timeout: 60000,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `bun run dev --webpack --port ${port}`,
    port,
    reuseExistingServer: true,
    timeout: 60000,
    // Pass test mode flag and test DB URL as env vars.
    // The app's lib/db/index.ts checks NEXT_PUBLIC_TEST_MODE at runtime
    // to switch from .env.local's DATABASE_URL to TEST_DATABASE_URL.
    env: {
      ...process.env as Record<string, string>,
      NEXT_PUBLIC_TEST_MODE: "true",
      TEST_DATABASE_URL: testEnv.TEST_DATABASE_URL || testEnv.DATABASE_URL || "",
    },
  },
});
