import { defineConfig, devices } from "@playwright/test";
import { STORAGE_STATE } from "./tests/e2e/credentials";

export default defineConfig({
  testDir: "./tests/e2e",
  // Creates the account the suite signs in as, and migrates the scratch
  // database it lives in.
  globalSetup: "./tests/e2e/global-setup.ts",
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      // Every spec but auth.spec.ts starts already signed in; that one
      // opts out with an empty storage state.
      use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: process.env.CI ? "npm start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? "file:/tmp/e2e.db",
      UPLOAD_DIR: process.env.UPLOAD_DIR ?? "/tmp/e2e-uploads",
      // H7 requires IMPORT_SECRET in production (NODE_ENV=production, i.e.
      // `npm start` under CI); tests/e2e/garments.spec.ts sends this same
      // value as a Bearer token on /api/import.
      IMPORT_SECRET: "e2e-test-secret",
      // Auth.js signs the session cookie with this. Deterministic here so
      // a restarted server does not invalidate the saved storage state.
      AUTH_SECRET: "e2e-auth-secret-not-used-anywhere-else",
    },
    timeout: 60_000,
  },
});
