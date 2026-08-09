import { describe, it, expect } from "vitest";
import { buildRows } from "@/lib/bugaderia/rows";
import type { GarmentWithColors } from "@/lib/prendas/types";

function garment(
  overrides: Partial<GarmentWithColors> & Pick<GarmentWithColors, "id" | "category">,
): GarmentWithColors {
  return {
    texture: null,
    pattern: null,
    size: null,
    subtype: null,
    length: null,
    fit: null,
    notes: null,
    image: null,
    dirtySince: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    colors: [],
    seasons: [{ id: "s1", season: "ALL_YEAR" }],
    ...overrides,
  };
}

describe("buildRows", () => {
  it("drops dirty garments from their row", () => {
    const clean = garment({ id: "clean-shirt", category: "SHIRT" });
    const dirty = garment({ id: "dirty-shirt", category: "SHIRT", dirtySince: new Date() });
    const rows = buildRows([clean, dirty], "SUMMER", new Map());
    expect(rows.SHIRT.map((g) => g.id)).toEqual(["clean-shirt"]);
  });

  it("drops garments out of season, keeping ALL_YEAR", () => {
    const summer = garment({
      id: "summer-shirt",
      category: "SHIRT",
      seasons: [{ id: "s1", season: "SUMMER" }],
    });
    const winter = garment({
      id: "winter-shirt",
      category: "SHIRT",
      seasons: [{ id: "s2", season: "WINTER" }],
    });
    const allYear = garment({
      id: "all-year-shirt",
      category: "SHIRT",
      seasons: [{ id: "s3", season: "ALL_YEAR" }],
    });
    const rows = buildRows([summer, winter, allYear], "SUMMER", new Map());
    expect(new Set(rows.SHIRT.map((g) => g.id))).toEqual(
      new Set(["summer-shirt", "all-year-shirt"]),
    );
  });

  it("keeps garments with no season recorded, whatever the season", () => {
    // Shoes and accessories often carry no season. Treating that as
    // "fits no season" emptied the shoes row and disabled the builder.
    const seasonless = garment({ id: "shoes", category: "SHOES", seasons: [] });
    expect(buildRows([seasonless], "SUMMER", new Map()).SHOES.map((g) => g.id)).toEqual(["shoes"]);
    expect(buildRows([seasonless], "WINTER", new Map()).SHOES.map((g) => g.id)).toEqual(["shoes"]);
  });

  it("orders least-recently-worn first, never-worn winning over any date", () => {
    const old = garment({ id: "old", category: "PANTS" });
    const recent = garment({ id: "recent", category: "PANTS" });
    const neverWorn = garment({ id: "never", category: "PANTS" });
    const lastWorn = new Map([
      ["old", new Date("2026-01-01")],
      ["recent", new Date("2026-08-01")],
    ]);
    const rows = buildRows([recent, old, neverWorn], "SUMMER", lastWorn);
    expect(rows.PANTS.map((g) => g.id)).toEqual(["never", "old", "recent"]);
  });

  it("only fills the four builder categories, ignoring the rest of the catalogue", () => {
    const rows = buildRows(
      [garment({ id: "socks", category: "SOCKS" }), garment({ id: "ring", category: "ACCESSORI" })],
      "SUMMER",
      new Map(),
    );
    expect(rows.SHIRT).toEqual([]);
    expect(rows.PANTS).toEqual([]);
    expect(rows.SHOES).toEqual([]);
    expect(rows.SWEATER).toEqual([]);
  });
});
