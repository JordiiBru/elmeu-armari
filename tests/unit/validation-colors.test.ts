import { describe, it, expect } from "vitest";
import { validateGarmentForm } from "@/lib/prendas/validation";
import {
  FITS_BY_CATEGORY,
  SUBTYPES_BY_CATEGORY,
  SIZES_BY_CATEGORY,
  LENGTHS_BY_CATEGORY,
  TEXTURES_BY_CATEGORY,
  PATTERNS_BY_CATEGORY,
} from "@/lib/prendas/types";
import type { Category } from "@/lib/prendas/types";

// A complete, valid form for a category, colours aside: the first option
// of every list the category defines.
function formFor(category: Category, colors: string[]): FormData {
  const fd = new FormData();
  fd.set("category", category);
  const first = (list: readonly string[]) => list[0];
  const fields: [string, readonly string[]][] = [
    ["texture", TEXTURES_BY_CATEGORY[category]],
    ["pattern", PATTERNS_BY_CATEGORY[category]],
    ["fit", FITS_BY_CATEGORY[category]],
    ["size", SIZES_BY_CATEGORY[category]],
    ["subtype", SUBTYPES_BY_CATEGORY[category]],
    ["length", LENGTHS_BY_CATEGORY[category]],
  ];
  for (const [name, list] of fields) if (list.length > 0) fd.set(name, first(list));
  fd.append("season", "ALL_YEAR");
  for (const c of colors) fd.append("color", c);
  return fd;
}

describe("garment form: colours", () => {
  it("rejects a garment with no colour instead of saving black", () => {
    const result = validateGarmentForm(formFor("SHIRT", []));
    expect(result).toMatchObject({ ok: false, error: "minOneColor" });
  });

  it("accepts the colours that were picked", () => {
    const result = validateGarmentForm(formFor("SHIRT", ["#1b2c50"]));
    expect(result.ok).toBe(true);
  });

  it("lets an accessory go without a colour", () => {
    const result = validateGarmentForm(formFor("ACCESSORI", []));
    expect(result.ok).toBe(true);
  });
});
