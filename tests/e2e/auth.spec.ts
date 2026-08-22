import { test, expect } from "@playwright/test";
import { E2E_PASSWORD, E2E_USERNAME } from "./credentials";

// Signed out on purpose: this is the spec that walks through the door.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe.configure({ mode: "serial" });

test("an anonymous visitor cannot reach the wardrobe", async ({ page }) => {
  await page.goto("/armari");
  await expect(page).toHaveURL("/login?next=%2Farmari");
});

test("an anonymous fetch of the export gets a 401", async ({ request }) => {
  const response = await request.get("/api/export", { maxRedirects: 0 });
  expect(response.status()).toBe(401);
});

test("a wrong password says nothing useful", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[name="username"]').fill(E2E_USERNAME);
  await page.locator('input[name="password"]').fill("not the password");
  await page.getByRole("button", { name: "entrar" }).click();

  // Not `getByRole("alert")`: Next's own route announcer is one too.
  await expect(page.getByText(/incorrectes/i)).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("signing in lands on the screen that was asked for", async ({ page }) => {
  await page.goto("/armari");
  await page.locator('input[name="username"]').fill(E2E_USERNAME);
  await page.locator('input[name="password"]').fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "entrar" }).click();

  await expect(page).toHaveURL("/armari");

  // And back out again, from the menu the session row lives in.
  await page.getByRole("button", { name: "Menú" }).click();
  await page.getByRole("button", { name: "sortir" }).click();
  await expect(page).toHaveURL("/login");
});
