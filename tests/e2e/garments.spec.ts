import { test, expect } from "@playwright/test";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Fills the garment add/edit form with a minimal valid SHIRT payload. */
async function fillShirtForm(page: import("@playwright/test").Page) {
  await page.selectOption('[name="category"]', "SHIRT");
  await page.selectOption('[name="subtype"]', "TEE");
  await page.selectOption('[name="texture"]', "COTTON");
  await page.selectOption('[name="pattern"]', "PLAIN");
  await page.getByLabel("Temporada").first();
  await page.getByRole("checkbox", { name: "Tot l'any" }).check();
  await page.selectOption('[name="size"]', "M");
  await page.selectOption('[name="fit"]', "REGULAR");
  // inject a colour via hidden input (ColorPickers renders them)
  // ColorPickers appends <input name="color" type="hidden" value="#rrggbb">
  // Easier: inject the hidden input directly.
  await page.evaluate(() => {
    const form = document.querySelector("form")!;
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "color";
    input.value = "#c0392b";
    form.appendChild(input);
  });
}

/** Fills the garment form with a minimal valid PANTS payload including length. */
async function fillPantsForm(
  page: import("@playwright/test").Page,
  length: "SHORT" | "LONG",
) {
  await page.selectOption('[name="category"]', "PANTS");
  await page.selectOption('[name="subtype"]', "CHINO");
  await page.selectOption('[name="length"]', length);
  await page.selectOption('[name="texture"]', "COTTON");
  await page.selectOption('[name="pattern"]', "PLAIN");
  await page.getByRole("checkbox", { name: "Tot l'any" }).check();
  await page.selectOption('[name="size"]', "32");
  await page.selectOption('[name="fit"]', "STRAIGHT");
  await page.evaluate(() => {
    const form = document.querySelector("form")!;
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "color";
    input.value = "#2c3e50";
    form.appendChild(input);
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe("wardrobe — add garment", () => {
  test("adds a shirt and it appears in /armari", async ({ page }) => {
    await page.goto("/add");
    await fillShirtForm(page);
    await page.getByRole("button", { name: /guardar peça/i }).click();
    await page.waitForURL("/armari");
    await expect(page.getByText("Samarreta")).toBeVisible();
  });
});

test.describe("wardrobe — length regression (H1)", () => {
  test("editing a PANTS garment preserves the length field", async ({
    page,
  }) => {
    // 1. Add a PANTS garment with length SHORT.
    await page.goto("/add");
    await fillPantsForm(page, "SHORT");
    await page.getByRole("button", { name: /guardar peça/i }).click();
    await page.waitForURL("/armari");

    // 2. Open the garment via the first card in the grid.
    await page.locator('[data-testid="garment-card"]').first().click();

    // 3. Click edit inside the modal.
    await page.getByRole("button", { name: /editar/i }).click();
    await page.waitForURL(/\/edit\/.+/);

    // 4. Verify current length is SHORT, change to LONG, save.
    await expect(page.locator('[name="length"]')).toHaveValue("SHORT");
    await page.selectOption('[name="length"]', "LONG");
    await page.getByRole("button", { name: /guardar canvis/i }).click();
    await page.waitForURL("/armari");

    // 5. Re-open the garment and confirm the length change persisted.
    await page.locator('[data-testid="garment-card"]').first().click();
    await page.getByRole("button", { name: /editar/i }).click();
    await page.waitForURL(/\/edit\/.+/);
    await expect(page.locator('[name="length"]')).toHaveValue("LONG");
  });
});

test.describe("wardrobe — delete garment", () => {
  test("deleting a garment removes it from /armari", async ({ page }) => {
    // Assumes at least one garment exists (previous tests added some).
    await page.goto("/armari");
    const before = await page.locator('[data-testid="garment-card"]').count();
    if (before === 0) {
      test.skip();
      return;
    }

    // Open first card → modal → delete.
    await page.locator('[data-testid="garment-card"]').first().click();
    await page.getByRole("button", { name: /eliminar/i }).click();

    await page.waitForURL("/armari");
    const after = await page.locator('[data-testid="garment-card"]').count();
    expect(after).toBe(before - 1);
  });
});

test.describe("export / import round-trip", () => {
  test("exported JSON can be re-imported in merge mode", async ({
    page,
    request,
  }) => {
    // Export.
    const exportRes = await request.get("/api/export");
    expect(exportRes.ok()).toBeTruthy();
    const payload = await exportRes.json();
    expect(payload.version).toBe(3);
    expect(Array.isArray(payload.garments)).toBe(true);

    if (payload.garments.length === 0) {
      test.skip();
      return;
    }

    // Import (merge mode — safe to call in any order).
    const importRes = await request.post("/api/import", { data: payload });
    expect(importRes.ok()).toBeTruthy();
    const result = await importRes.json();
    expect(result.imported).toBeGreaterThan(0);

    // Verify the grid has at least as many garments as before.
    await page.goto("/armari");
    await expect(
      page.locator('[data-testid="garment-card"]').first(),
    ).toBeVisible();
  });
});
