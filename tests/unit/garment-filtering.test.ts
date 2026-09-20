import { describe, it, expect } from "vitest";
import { filterGarments } from "@/lib/prendas/filtering";
import type { GarmentFilters } from "@/lib/prendas/filtering";
import type { Category, GarmentWithColors, Season } from "@/lib/prendas/types";

function garment(
  id: string,
  category: Category,
  opts: { length?: string | null; seasons?: Season[] } = {},
): GarmentWithColors {
  return {
    id,
    category,
    texture: null,
    pattern: null,
    size: null,
    subtype: null,
    length: opts.length ?? null,
    fit: null,
    cropped: false,
    notes: null,
    image: null,
    dirtySince: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    colors: [],
    seasons: (opts.seasons ?? []).map((season, i) => ({ id: `${id}-s${i}`, season })),
  };
}

const baseFilters: GarmentFilters = {
  categories: [],
  seasons: [],
  fits: [],
  textures: [],
  lengths: [],
  colors: [],
  states: [],
  query: "",
};

describe("filterGarments — season", () => {
  it("excludes a garment whose season doesn't match the filter", () => {
    const shirt = garment("1", "SHIRT", { seasons: ["WINTER"] });
    const result = filterGarments([shirt], { ...baseFilters, seasons: ["SUMMER"] });
    expect(result).toEqual([]);
  });

  it("never excludes short pants, regardless of the active season filter", () => {
    const shorts = garment("1", "PANTS", { length: "SHORT", seasons: ["SUMMER"] });
    const result = filterGarments([shorts], { ...baseFilters, seasons: ["WINTER"] });
    expect(result.map((g) => g.id)).toEqual(["1"]);
  });

  it("sinks short pants behind matching garments when the filter is off-season", () => {
    const shorts = garment("shorts", "PANTS", { length: "SHORT", seasons: ["SUMMER"] });
    const jacket = garment("jacket", "SHIRT", { seasons: ["WINTER"] });
    const result = filterGarments([shorts, jacket], { ...baseFilters, seasons: ["WINTER"] });
    expect(result.map((g) => g.id)).toEqual(["jacket", "shorts"]);
  });

  it("keeps short pants in their normal position when the filter matches summer", () => {
    const shorts = garment("shorts", "PANTS", { length: "SHORT", seasons: ["SUMMER"] });
    const tee = garment("tee", "SHIRT", { seasons: ["SUMMER"] });
    const result = filterGarments([shorts, tee], { ...baseFilters, seasons: ["SUMMER"] });
    expect(result.map((g) => g.id)).toEqual(["shorts", "tee"]);
  });

  it("doesn't reorder anything when no season filter is active", () => {
    const shorts = garment("shorts", "PANTS", { length: "SHORT", seasons: ["SUMMER"] });
    const jacket = garment("jacket", "SHIRT", { seasons: ["WINTER"] });
    const result = filterGarments([shorts, jacket], baseFilters);
    expect(result.map((g) => g.id)).toEqual(["shorts", "jacket"]);
  });

  it("long pants are not exempt — they follow the normal season rule", () => {
    const longPants = garment("1", "PANTS", { length: "LONG", seasons: ["WINTER"] });
    const result = filterGarments([longPants], { ...baseFilters, seasons: ["SUMMER"] });
    expect(result).toEqual([]);
  });
});
