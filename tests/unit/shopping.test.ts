import { describe, it, expect } from "vitest";
import { namedColors } from "@/lib/colors";
import {
  assessColour,
  familyOf,
  isWearableIn,
  recommendColours,
  wardrobeReach,
  CANDIDATE_ID,
} from "@/lib/outfits/shopping";
import type { Category, GarmentWithColors } from "@/lib/prendas/types";

const BLACK = "#000000";
const WHITE = "#ffffff";

function g(id: string, category: Category, hexes: string[]): GarmentWithColors {
  return {
    id,
    category,
    texture: null,
    pattern: null,
    fit: null,
    subtype: null,
    size: null,
    length: category === "PANTS" ? "LONG" : null,
    cropped: false,
    notes: null,
    image: null,
    dirtySince: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    colors: hexes.map((hex, i) => ({ id: `${id}-c${i}`, hex })),
    seasons: [],
  };
}

const hexOf = (name: string) => {
  const c = namedColors.find((n) => n.name === name);
  if (!c) throw new Error(`no Sanzo colour ${name}`);
  return c.hex;
};

/** A small wardrobe in the colours most people own: black, white, navy. */
const WARDROBE = [
  g("tee-black", "SHIRT", [BLACK]),
  g("tee-white", "SHIRT", [WHITE]),
  g("sweater-navy", "SWEATER", [hexOf("Dark Tyrian Blue")]),
  g("jeans", "PANTS", [hexOf("Dark Tyrian Blue")]),
  g("chinos-black", "PANTS", [BLACK]),
  g("sneakers", "SHOES", [WHITE]),
  g("coat", "OUTERWEAR", [hexOf("Ecru")]),
  g("bag", "ACCESSORI", [hexOf("Spectrum Red")]),
];

describe("colour families", () => {
  it.each([
    ["Black", "neutral"],
    ["Neutral Gray", "neutral"],
    ["Ecru", "earth"],
    ["Vandyke Brown", "earth"],
    ["Olive Green", "green"],
    ["Dark Tyrian Blue", "blue"],
    ["Violet", "purple"],
    ["Vandyke Red", "red"],
    // A pale tint is not a grey, even when its chroma is low.
    ["Glaucous Green", "green"],
  ])("%s is %s", (name, family) => {
    expect(familyOf(hexOf(name))).toBe(family);
  });
});

describe("what is wearable in each category", () => {
  // The cases a person would say out loud. Tune the families in
  // shopping.ts against these, not by eye.
  it.each([
    ["Black", true],
    ["Neutral Gray", true],
    ["Ecru", true],
    ["Mars Brown / Tobacco", true],
    ["Light Brownish Olive", true],
    ["Olive Green", true],
    ["Dark Tyrian Blue", true],
    ["Olympic Blue", true],
    ["Vandyke Red", true],
    ["Spectrum Red", false],
    ["Orange Yellow", false],
    ["Hermosa Pink", false],
    ["Glaucous Green", false],
    ["Nile Blue", false],
    ["Cerulian Blue", false],
    ["Violet", false],
  ])("trousers in %s: %s", (name, wearable) => {
    expect(isWearableIn("PANTS", hexOf(name))).toBe(wearable);
  });

  it.each([
    ["Vandyke Brown", true],
    ["Dull Violet Black", true],
    ["Pale Burnt Lake", true],
    ["Olympic Blue", false],
    ["Pinkish Cinnamon", false],
  ])("shoes in %s: %s", (name, wearable) => {
    expect(isWearableIn("SHOES", hexOf(name))).toBe(wearable);
  });

  it("tops take any colour but the loudest", () => {
    expect(isWearableIn("SHIRT", hexOf("Coral Red"))).toBe(true);
    expect(isWearableIn("SWEATER", hexOf("Olive Buff"))).toBe(true);
    expect(isWearableIn("SHIRT", hexOf("Spectrum Red"))).toBe(false);
    expect(isWearableIn("SWEATER", hexOf("Yellow"))).toBe(false);
  });
});

describe("assessColour", () => {
  const reach = wardrobeReach(WARDROBE);

  it("reads only the pieces the engine matches", () => {
    expect(reach.pieces.map((p) => p.id)).not.toContain("coat");
    expect(reach.pieces.map((p) => p.id)).not.toContain("bag");
    expect(reach.reached.size).toBeGreaterThan(0);
  });

  it("calls a colour you already own in that category a duplicate", () => {
    const a = assessColour("PANTS", BLACK, reach);
    expect(a.verdict).toBe("duplicate");
    expect(a.duplicates.map((d) => d.id)).toEqual(["chinos-black"]);
  });

  it("does not call it a duplicate in another category", () => {
    const a = assessColour("SHOES", hexOf("Dark Tyrian Blue"), reach);
    expect(a.duplicates).toEqual([]);
  });

  it("lists the pieces it goes with, never itself", () => {
    const a = assessColour("PANTS", hexOf("Ecru"), reach);
    expect(a.examples.length).toBeGreaterThan(0);
    expect(a.partners.length).toBeGreaterThan(0);
    expect(a.partners.every((p) => p.id !== CANDIDATE_ID && p.category !== "PANTS")).toBe(true);
    // Coloured shirts, sweaters and shoes only: the navy sweater. The black
    // and white tees and the white trainers go with anything.
    expect(a.partnerPool).toBe(1);
  });

  it("never counts black or white as a match", () => {
    for (const hex of [hexOf("Ecru"), hexOf("Mars Brown / Tobacco"), BLACK]) {
      const a = assessColour("PANTS", hex, reach);
      expect(a.partners.map((p) => p.id)).not.toContain("tee-black");
      expect(a.partners.map((p) => p.id)).not.toContain("tee-white");
      expect(a.partners.map((p) => p.id)).not.toContain("sneakers");
    }
  });

  it("counts as new only the palettes the wardrobe does not reach", () => {
    const a = assessColour("SWEATER", hexOf("Olive Green"), reach);
    for (const p of a.newPalettes) expect(reach.reached.has(p.id)).toBe(false);
    expect(a.newPalettes.length).toBeLessThanOrEqual(a.palettes.length);
  });

  it("shows one example look per palette, new palettes first", () => {
    const a = assessColour("PANTS", hexOf("Ecru"), reach);
    const ids = a.examples.map((e) => e.palette.id);
    expect(new Set(ids).size).toBe(ids.length);
    const flags = a.examples.map((e) => e.fresh);
    expect(flags).toEqual([...flags].sort((x, y) => Number(y) - Number(x)));
    const fresh = new Set(a.newPalettes.map((p) => p.id));
    for (const e of a.examples) expect(e.fresh).toBe(fresh.has(e.palette.id));
  });

  it("marks the colour of the palette the new piece is worn as", () => {
    const a = assessColour("PANTS", hexOf("Ecru"), reach);
    for (const e of a.examples) {
      if (e.candidateIndex === null) continue;
      expect(e.candidateIndex).toBeGreaterThanOrEqual(0);
      expect(e.candidateIndex).toBeLessThan(e.palette.colores.length);
    }
    expect(a.examples.some((e) => e.candidateIndex !== null)).toBe(true);
  });

  it("says none when nothing in the wardrobe can be worn with it", () => {
    const onlyTrousers = wardrobeReach([g("p", "PANTS", [BLACK])]);
    const a = assessColour("PANTS", hexOf("Ecru"), onlyTrousers);
    expect(a.verdict).toBe("none");
    expect(a.examples).toEqual([]);
    expect(a.featured).toEqual([]);
  });

  it("still assesses a colour that is unusual for the category, and flags it", () => {
    const a = assessColour("PANTS", hexOf("Spectrum Red"), reach);
    expect(a.wearable).toBe(false);
  });
});

describe("the preview of a card", () => {
  // A coloured wardrobe beside the black and white that fits everything.
  const coloured = [
    ...WARDROBE,
    g("tee-rust", "SHIRT", [hexOf("Burnt Sienna")]),
    g("sweater-olive", "SWEATER", [hexOf("Olive Green")]),
    g("tee-teal", "SHIRT", [hexOf("Peacock Blue")]),
  ];
  const reach = wardrobeReach(coloured);

  it("only features pieces the example looks wear", () => {
    for (const hex of [hexOf("Ecru"), hexOf("Mars Brown / Tobacco"), hexOf("Dark Tyrian Blue")]) {
      const a = assessColour("PANTS", hex, reach);
      const inLooks = new Set(a.examples.flatMap((e) => e.group.garments.map((x) => x.id)));
      for (const p of a.featured) expect(inLooks.has(p.id)).toBe(true);
    }
  });

  it("leaves black and white out when the looks have coloured pieces", () => {
    const a = assessColour("PANTS", hexOf("Ecru"), reach);
    const ids = a.featured.map((p) => p.id);
    expect(ids).toEqual(expect.arrayContaining(["sweater-navy", "sweater-olive", "tee-teal"]));
    expect(ids).not.toContain("tee-black");
    expect(ids).not.toContain("tee-white");
    expect(ids).not.toContain("sneakers");
    // The looks themselves are built on the coloured pieces, not on black.
    expect(a.examples.every((e) => !e.group.garments.some((x) => x.id === "tee-black"))).toBe(true);
  });

  it("falls back to black and white when nothing else goes", () => {
    const plain = wardrobeReach([
      g("tee-black", "SHIRT", [BLACK]),
      g("sneakers", "SHOES", [WHITE]),
    ]);
    const a = assessColour("PANTS", hexOf("Ecru"), plain);
    expect(a.featured.map((p) => p.id).sort()).toEqual(["sneakers", "tee-black"]);
  });
});

describe("recommendColours", () => {
  const reach = wardrobeReach(WARDROBE);
  const recs = recommendColours("PANTS", reach);

  it("only suggests wearable colours you do not own yet", () => {
    expect(recs.length).toBeGreaterThan(0);
    for (const a of recs) {
      expect(a.wearable).toBe(true);
      expect(a.verdict).not.toBe("duplicate");
      expect(a.verdict).not.toBe("none");
    }
  });

  it("ranks by new palettes first", () => {
    const fresh = recs.map((a) => a.newPalettes.length);
    expect(fresh).toEqual([...fresh].sort((x, y) => y - x));
  });

  it("keeps one of each near twin", () => {
    const names = recs.map((a) => a.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("returns nothing, not an error, for an empty wardrobe", () => {
    expect(recommendColours("SHIRT", wardrobeReach([]))).toEqual([]);
  });
});
