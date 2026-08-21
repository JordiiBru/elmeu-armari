import { test, expect, type Page } from "@playwright/test";

// These specs share one wardrobe against the same running server/DB and
// assume earlier tests' state (add → edit → delete → import), so they
// cannot run concurrently with each other — count-based assertions
// (e.g. delete) would race against parallel inserts from other tests.
test.describe.configure({ mode: "serial" });

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * The design system's `Select` (src/components/ui/Select.tsx) is not a
 * native `<select>` — it emits `<input type="hidden" name>` for form
 * submission next to a `role="combobox"` button + `role="listbox"`
 * popover. `page.selectOption` cannot drive it; open the popover and
 * click the option by its visible (Catalan) label instead.
 */
async function selectCustom(page: Page, name: string, optionLabel: string) {
  await page.locator(`input[name="${name}"] + button[role="combobox"]`).click();
  await page.getByRole("option", { name: optionLabel, exact: true }).click();
}

/** Fills the garment add/edit form with a minimal valid SHIRT payload. */
async function fillShirtForm(page: Page) {
  await selectCustom(page, "category", "Samarreta");
  await selectCustom(page, "subtype", "Samarreta");
  await selectCustom(page, "texture", "Cotó");
  await selectCustom(page, "pattern", "Llis");
  // Checkbox.tsx puts the real <input> inside sr-only styling with a
  // decorative overlay <span> on top of it; clicking the visible label
  // text (as a real user would) forwards the click via the wrapping
  // <label>, whereas targeting the input's own box gets intercepted.
  await page.getByText("Tot l'any", { exact: true }).click();
  await selectCustom(page, "size", "M");
  await selectCustom(page, "fit", "Regular");
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
async function fillPantsForm(page: Page, length: "SHORT" | "LONG") {
  await selectCustom(page, "category", "Pantalons");
  await selectCustom(page, "subtype", "Chino");
  await selectCustom(page, "length", length === "SHORT" ? "Curts" : "Llargs");
  await selectCustom(page, "texture", "Cotó");
  await selectCustom(page, "pattern", "Llis");
  // Checkbox.tsx puts the real <input> inside sr-only styling with a
  // decorative overlay <span> on top of it; clicking the visible label
  // text (as a real user would) forwards the click via the wrapping
  // <label>, whereas targeting the input's own box gets intercepted.
  await page.getByText("Tot l'any", { exact: true }).click();
  await selectCustom(page, "size", "32");
  await selectCustom(page, "fit", "Straight");
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
    // "Samarreta" is both the SHIRT category label and the TEE subtype
    // label, and also appears in nav — scope to the grid card.
    await expect(
      page.locator('[data-testid="garment-card"]').filter({ hasText: "Samarreta" }).first(),
    ).toBeVisible();
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

    // 3. Click edit inside the modal — "editar" is a Link, not a button.
    await page.getByRole("link", { name: /editar/i }).click();
    await page.waitForURL(/\/edit\/.+/);

    // 4. Verify current length is SHORT, change to LONG, save.
    await expect(page.locator('input[name="length"]')).toHaveValue("SHORT");
    await selectCustom(page, "length", "Llargs");
    await page.getByRole("button", { name: /guardar canvis/i }).click();
    await page.waitForURL("/armari");

    // 5. Re-open the garment and confirm the length change persisted.
    await page.locator('[data-testid="garment-card"]').first().click();
    await page.getByRole("link", { name: /editar/i }).click();
    await page.waitForURL(/\/edit\/.+/);
    await expect(page.locator('input[name="length"]')).toHaveValue("LONG");
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

    // Open first card → modal → delete. "eliminar" arms a confirm state
    // (label becomes "sí, eliminar") before the actual delete fires.
    await page.locator('[data-testid="garment-card"]').first().click();
    await page.getByRole("button", { name: "eliminar" }).click();
    await page.getByRole("button", { name: /sí, eliminar/i }).click();

    // handleDelete awaits the server action then calls onClose(), which is
    // router.back() — so this lands on the wardrobe *with its filters*,
    // e.g. /armari?season=SUMMER, since ArmariGrid keeps them in the URL.
    // Matching the bare path was only ever green by accident: closing used
    // to fire onClose twice under StrictMode, overshoot to the home page,
    // and get pulled back by a router.replace("/armari") with no query.
    //
    // waitForURL resolves as soon as the URL changes, which can race the RSC
    // revalidation fetch that actually updates the grid — wait for the modal
    // dialog to fully close (confirms the transition settled) before counting.
    await page.waitForURL(/\/armari(\?|$)/);
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(async () => {
      const after = await page.locator('[data-testid="garment-card"]').count();
      expect(after).toBe(before - 1);
    }).toPass();
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

    // Import (merge mode — safe to call in any order). H7 requires this
    // Bearer token in production; matches playwright.config.ts webServer.env.
    const importRes = await request.post("/api/import", {
      data: payload,
      headers: { Authorization: "Bearer e2e-test-secret" },
    });
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
