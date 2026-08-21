import { describe, it, expect } from "vitest";
import { groupOutfitsBy } from "@/lib/outfits/grouping";
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

describe("groupOutfitsBy", () => {
  it("files every outfit under its piece of that category", () => {
    const groups = groupOutfitsBy(
      [
        outfit("1", [shirtA, pants]),
        outfit("2", [shirtB, pants]),
        outfit("3", [shirtA, pants]),
      ],
      "SHIRT",
    );
    expect(groups.map((g) => g.piece.id)).toEqual(["shirt-a", "shirt-b"]);
    expect(groups[0].outfits.map((o) => o.id)).toEqual(["1", "3"]);
  });

  it("indexes the same collection by a different piece", () => {
    const outfits = [outfit("1", [shirtA, pants]), outfit("2", [shirtB, pants])];
    const byPants = groupOutfitsBy(outfits, "PANTS");
    expect(byPants).toHaveLength(1);
    expect(byPants[0].outfits.map((o) => o.id)).toEqual(["1", "2"]);
  });

  it("keeps the order each piece first appears in", () => {
    const groups = groupOutfitsBy(
      [outfit("1", [shirtB, pants]), outfit("2", [shirtA, pants])],
      "SHIRT",
    );
    expect(groups.map((g) => g.piece.id)).toEqual(["shirt-b", "shirt-a"]);
  });

  it("leaves out outfits with no piece of that category", () => {
    const groups = groupOutfitsBy(
      [outfit("1", [pants]), outfit("2", [sweater, pants])],
      "SWEATER",
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].outfits.map((o) => o.id)).toEqual(["2"]);
  });

  it("returns nothing for nothing", () => {
    expect(groupOutfitsBy([], "SHIRT")).toEqual([]);
  });
});
