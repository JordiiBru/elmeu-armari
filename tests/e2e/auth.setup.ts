import { test as setup, expect } from "@playwright/test";
import { E2E_PASSWORD, E2E_USERNAME, STORAGE_STATE } from "./credentials";

/**
 * Signs in once and saves the cookie jar; every other spec starts from
 * it instead of walking the login form again.
 */
setup("sign in", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[name="username"]').fill(E2E_USERNAME);
  await page.locator('input[name="password"]').fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "entrar" }).click();

  await expect(page).toHaveURL("/");
  await page.context().storageState({ path: STORAGE_STATE });
});
