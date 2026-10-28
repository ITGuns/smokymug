import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

// Same env source as tests/e2e/helpers/db.ts, so E2E_DATABASE_URL set in .env.local reaches the dev server too.
config({ path: ".env.local" });
const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL;

/** Dedicated port so a dev server from another local project on :3000 is never mistaken for this app. */
const PORT = Number(process.env.E2E_PORT ?? 3107);
const BASE_URL = `http://localhost:${PORT}`;

/**
 * End-to-end suite. Runs against a dev server on :3107 (E2E_PORT; reused if already up)
 * and the database in E2E_DATABASE_URL (else DATABASE_URL). Tests create clearly-labelled
 * "QA" records and remove them afterwards. A Supabase URL is refused unless
 * E2E_ALLOW_REMOTE=1 (see tests/e2e/helpers/db.ts).
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "tests/report" }]],
  use: {
    baseURL: BASE_URL,
    actionTimeout: 20_000,
    navigationTimeout: 90_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    { name: "public", testMatch: /public\/.*\.spec\.ts/, dependencies: ["setup"], use: { ...devices["Desktop Chrome"], viewport: { width: 1360, height: 900 } } },
    { name: "mobile", testMatch: /mobile\.spec\.ts/, dependencies: ["setup"], use: { ...devices["Pixel 7"] } },
    { name: "admin", testMatch: /admin\/.*\.spec\.ts/, dependencies: ["setup"], use: { ...devices["Desktop Chrome"], viewport: { width: 1360, height: 900 }, storageState: "tests/.auth/admin.json" } },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `${BASE_URL}/robots.txt`,
    // The app must write to the database the helpers read and clean. With E2E_DATABASE_URL set, start a
    // fresh server pointed at it; reusing one already running on DATABASE_URL would split the two.
    env: E2E_DATABASE_URL ? { DATABASE_URL: E2E_DATABASE_URL } : undefined,
    reuseExistingServer: !E2E_DATABASE_URL,
    timeout: 180_000,
  },
});
