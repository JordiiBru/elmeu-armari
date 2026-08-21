import { describe, it, expect } from "vitest";
import { groupOutfitsByTop, outfitTop } from "@/lib/outfits/grouping";
import type { SavedOutfit } from "@/lib/outfits/types";
import type { Category, GarmentWithColors } from "@/lib/prendas/types";

function garment(id: string, category: Category): GarmentWithColors {
  return {
    id,
    category,
    subtype: null,
    length: null,
    texture: null,
    pattern: null,
    fit: null,
    size: null,
    notes: null,
    image: null,
    dirtySince: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    colors: [],
    seasons: [],
  } as unknown as GarmentWithColors;
}

function outfit(id: string, garments: GarmentWithColors[]): SavedOutfit {
  return { id, name: id, paletteId: 1, createdAt: new Date(), garments, wornEvents: [] };
}

const shirtA = garment("shirt-a", "SHIRT");
const shirtB = garment("shirt-b", "SHIRT");
const sweater = garment("sweater", "SWEATER");
const pants = garment("pants", "PANTS");

describe("outfitTop", () => {
  it("prefers a shirt over a sweater", () => {
    expect(outfitTop(outfit("o", [sweater, shirtA, pants]))?.id).toBe("shirt-a");
  });

  it("falls back to the sweater", () => {
    expect(outfitTop(outfit("o", [sweater, pants]))?.id).toBe("sweater");
  });

  it("is null when there is neither", () => {
    expect(outfitTop(outfit("o", [pants]))).toBeNull();
  });
});

describe("groupOutfitsByTop", () => {
  it("files every outfit under the piece it is built around", () => {
    const groups = groupOutfitsByTop([
      outfit("1", [shirtA, pants]),
      outfit("2", [shirtB, pants]),
      outfit("3", [shirtA, pants]),
    ]);
    expect(groups.map((g) => g.top?.id)).toEqual(["shirt-a", "shirt-b"]);
    expect(groups[0].outfits.map((o) => o.id)).toEqual(["1", "3"]);
  });

  it("keeps the order each top first appears in", () => {
    const groups = groupOutfitsByTop([
      outfit("1", [shirtB, pants]),
      outfit("2", [shirtA, pants]),
    ]);
    expect(groups.map((g) => g.top?.id)).toEqual(["shirt-b", "shirt-a"]);
  });

  it("puts outfits with no top last, together", () => {
    const groups = groupOutfitsByTop([
      outfit("1", [pants]),
      outfit("2", [shirtA, pants]),
      outfit("3", [pants]),
    ]);
    expect(groups.at(-1)?.top).toBeNull();
    expect(groups.at(-1)?.outfits.map((o) => o.id)).toEqual(["1", "3"]);
  });

  it("returns nothing for nothing", () => {
    expect(groupOutfitsByTop([])).toEqual([]);
  });
});
