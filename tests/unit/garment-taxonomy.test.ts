import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  FITS_BY_CATEGORY,
  LENGTHS_BY_CATEGORY,
  PATTERNS_BY_CATEGORY,
  SUBTYPES_BY_CATEGORY,
  TEXTURES,
  CATEGORIES,
  lengthRequired,
} from "@/lib/prendas/types";
import { validateGarmentForm } from "@/lib/prendas/validation";

function form(fields: Record<string, string | string[]>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    for (const v of Array.isArray(value) ? value : [value]) data.append(key, v);
  }
  return data;
}

const tee = {
  category: "SHIRT",
  subtype: "TEE",
  size: "M",
  season: ["SUMMER"],
  color: ["#112233"],
};

describe("descriptive fields are optional", () => {
  it("accepts a tee with no fabric, pattern, fit or sleeve", () => {
    const result = validateGarmentForm(form(tee));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toMatchObject({ texture: null, pattern: null, fit: null, length: null });
    }
  });

  it("still validates what is given", () => {
    expect(validateGarmentForm(form({ ...tee, texture: "GOLD" })).ok).toBe(false);
    expect(validateGarmentForm(form({ ...tee, fit: "PRETZEL" })).ok).toBe(false);
    expect(validateGarmentForm(form({ ...tee, length: "LONG" })).ok).toBe(false);
  });

  it("accepts the new vocabulary", () => {
    const result = validateGarmentForm(
      form({ ...tee, texture: "WOOL", pattern: "CAMO", length: "LONG_SLEEVE", subtype: "HENLEY", size: "XXXL" }),
    );
    expect(result.ok).toBe(true);
  });

  it("keeps what defines a piece required: subtype, size, season and colour", () => {
    for (const drop of ["subtype", "size", "season", "color"]) {
      const fields: Record<string, string | string[]> = { ...tee };
      delete fields[drop];
      expect(validateGarmentForm(form(fields)).ok, drop).toBe(false);
    }
  });

  it("still asks trousers for their length, which decides the season", () => {
    const trousers = { category: "PANTS", subtype: "CHINO", size: "32", season: ["ALL_YEAR"], color: ["#112233"] };
    expect(lengthRequired("PANTS")).toBe(true);
    expect(validateGarmentForm(form(trousers)).ok).toBe(false);
    expect(validateGarmentForm(form({ ...trousers, length: "SHORT" })).ok).toBe(true);
  });

  it("does not let an accessory carry a fabric, a pattern or a fit", () => {
    const ring = { category: "ACCESSORI", subtype: "ANELL", season: ["ALL_YEAR"] };
    expect(validateGarmentForm(form(ring)).ok).toBe(true);
    expect(validateGarmentForm(form({ ...ring, texture: "LEATHER" })).ok).toBe(false);
  });
});

describe("every option has a label in all three languages", () => {
  const messages = Object.fromEntries(
    ["ca", "es", "en"].map((locale) => [
      locale,
      JSON.parse(readFileSync(path.resolve(__dirname, `../../messages/${locale}.json`), "utf8")).labels,
    ]),
  );

  // `optionLabel` falls back to the raw key when a label is missing, so a
  // forgotten translation would ship as "FLIP_FLOP" on screen with nothing
  // to fail. This is the thing that fails.
  const expected: Record<string, string[]> = {
    texture: TEXTURES,
    pattern: [...new Set(Object.values(PATTERNS_BY_CATEGORY).flat())],
    fit: [...new Set(Object.values(FITS_BY_CATEGORY).flat())],
    subtype: CATEGORIES.flatMap((c) => SUBTYPES_BY_CATEGORY[c]),
    length: [...new Set(Object.values(LENGTHS_BY_CATEGORY).flat())],
  };

  for (const [group, keys] of Object.entries(expected)) {
    it(`labels.${group}`, () => {
      for (const locale of Object.keys(messages)) {
        for (const key of keys) {
          expect(messages[locale][group][key], `${locale} ${group}.${key}`).toBeTruthy();
        }
      }
    });
  }
});
