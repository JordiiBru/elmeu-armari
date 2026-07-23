import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
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
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
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
    },
    timeout: 60_000,
  },
});
