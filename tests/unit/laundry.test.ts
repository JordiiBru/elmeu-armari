import { describe, it, expect } from "vitest";
import {
  isWashable,
  isDirty,
  dirtyGarmentsOf,
  isWearable,
  isInSeason,
  rankOutfitsForToday,
} from "@/lib/bugaderia/laundry";
import type { Category, GarmentWithColors, Season } from "@/lib/prendas/types";
import type { SavedOutfit } from "@/lib/outfits/types";

function garment(
  id: string,
  category: Category,
  opts: { dirty?: boolean; seasons?: Season[] } = {},
): GarmentWithColors {
  return {
    id,
    category,
    texture: "COTTON",
    pattern: "PLAIN",
    fit: null,
    subtype: null,
    size: null,
    length: null,
    notes: null,
    image: null,
    dirtySince: opts.dirty ? new Date("2026-08-01T09:00:00Z") : null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    colors: [{ id: `color-${id}`, hex: "#112233" }],
    seasons: (opts.seasons ?? ["ALL_YEAR"]).map((season, i) => ({
      id: `season-${id}-${i}`,
      season,
    })),
  };
}

function outfit(
  id: string,
  clothes: GarmentWithColors[],
  opts: { wornDates?: string[] } = {},
): SavedOutfit {
  return {
    id,
    name: id,
    paletteId: 1,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    wornEvents: (opts.wornDates ?? []).map((date, i) => ({
      id: `worn-${id}-${i}`,
      date: new Date(date),
      extras: [],
    })),
    garments: clothes,
  };
}

// ── isWashable / isDirty ──────────────────────────────────────────────────────

describe("isWashable", () => {
  it("sweaters, shirts and trousers are washable", () => {
    expect(isWashable(garment("a", "SWEATER"))).toBe(true);
    expect(isWashable(garment("b", "SHIRT"))).toBe(true);
    expect(isWashable(garment("c", "PANTS"))).toBe(true);
  });

  it("shoes, socks and accessories are not", () => {
    expect(isWashable(garment("d", "SHOES"))).toBe(false);
    expect(isWashable(garment("e", "SOCKS"))).toBe(false);
    expect(isWashable(garment("f", "ACCESSORI"))).toBe(false);
  });
});

describe("isDirty", () => {
  it("a washable garment with a dirtySince is dirty", () => {
    expect(isDirty(garment("a", "SHIRT", { dirty: true }))).toBe(true);
  });

  it("a washable garment without dirtySince is clean", () => {
    expect(isDirty(garment("a", "SHIRT"))).toBe(false);
  });

  it("a non-washable garment is never dirty, even carrying a dirtySince", () => {
    expect(isDirty(garment("s", "SHOES", { dirty: true }))).toBe(false);
    expect(isDirty(garment("k", "SOCKS", { dirty: true }))).toBe(false);
  });
});

// ── dirtyGarmentsOf / isWearable ─────────────────────────────────────────────

describe("isWearable", () => {
  it("an outfit is blocked only by its own clothes, not by what it's worn with", () => {
    // No clothes at all is trivially wearable — there's nothing to dirty.
    expect(isWearable(outfit("bare", []))).toBe(true);

    // Extras live on the worn day now, not on the outfit — a dirty pair
    // of shoes worn with it must not block the outfit itself.
    const withDirtyExtras = outfit("o1", [garment("sh", "SHIRT")], {
      wornDates: ["2026-08-01T00:00:00Z"],
    });
    withDirtyExtras.wornEvents[0].extras = [garment("s", "SHOES", { dirty: true })];
    expect(dirtyGarmentsOf(withDirtyExtras)).toEqual([]);
    expect(isWearable(withDirtyExtras)).toBe(true);
  });

  it("every piece clean is wearable", () => {
    const o = outfit("o2", [garment("sh", "SHIRT"), garment("pa", "PANTS")]);
    expect(isWearable(o)).toBe(true);
    expect(dirtyGarmentsOf(o)).toEqual([]);
  });

  it("one dirty piece is enough to block it, and it is named", () => {
    const o = outfit("o3", [garment("sh", "SHIRT", { dirty: true }), garment("pa", "PANTS")]);
    expect(isWearable(o)).toBe(false);
    expect(dirtyGarmentsOf(o).map((g) => g.id)).toEqual(["sh"]);
  });

  it("names every dirty piece, not just the first", () => {
    const o = outfit("o4", [
      garment("sh", "SHIRT", { dirty: true }),
      garment("pa", "PANTS", { dirty: true }),
      garment("sw", "SWEATER"),
    ]);
    expect(isWearable(o)).toBe(false);
    expect(dirtyGarmentsOf(o)).toHaveLength(2);
  });
});

// ── isInSeason ────────────────────────────────────────────────────────────────

describe("isInSeason", () => {
  it("every primary piece must fit the season", () => {
    const o = outfit("o6", [
      garment("sh", "SHIRT", { seasons: ["SUMMER"] }),
      garment("pa", "PANTS", { seasons: ["ALL_YEAR"] }),
    ]);
    expect(isInSeason(o, "SUMMER")).toBe(true);
  });

  it("an all-year piece plus a winter one is not a summer outfit", () => {
    const o = outfit("o7", [
      garment("pa", "PANTS", { seasons: ["ALL_YEAR"] }),
      garment("sw", "SWEATER", { seasons: ["WINTER"] }),
    ]);
    expect(isInSeason(o, "SUMMER")).toBe(false);
    expect(isInSeason(o, "WINTER")).toBe(true);
  });

  it("extras do not decide seasonality — they live on the day, not the outfit", () => {
    const o = outfit("o8", [garment("sh", "SHIRT", { seasons: ["SUMMER"] })], {
      wornDates: ["2026-08-01T00:00:00Z"],
    });
    o.wornEvents[0].extras = [garment("bo", "SHOES", { seasons: ["WINTER"] })];
    expect(isInSeason(o, "SUMMER")).toBe(true);
  });
});

// ── rankOutfitsForToday ───────────────────────────────────────────────────────

describe("rankOutfitsForToday", () => {
  it("in-season outfits come first, out-of-season ones are kept, not dropped", () => {
    const winter = outfit("winter", [garment("sw", "SWEATER", { seasons: ["WINTER"] })], {
      wornDates: ["2020-01-01T00:00:00Z"],
    });
    const summer = outfit("summer", [garment("sh", "SHIRT", { seasons: ["SUMMER"] })], {
      wornDates: ["2026-08-01T00:00:00Z"],
    });
    const ranked = rankOutfitsForToday([winter, summer], "SUMMER");
    expect(ranked.map((o) => o.id)).toEqual(["summer", "winter"]);
  });

  it("within a block, never worn first, then the oldest", () => {
    const recent = outfit("recent", [garment("a", "SHIRT")], {
      wornDates: ["2026-08-01T00:00:00Z"],
    });
    const old = outfit("old", [garment("b", "SHIRT")], {
      wornDates: ["2026-01-01T00:00:00Z"],
    });
    const never = outfit("never", [garment("c", "SHIRT")]);
    const ranked = rankOutfitsForToday([recent, old, never], "SUMMER");
    expect(ranked.map((o) => o.id)).toEqual(["never", "old", "recent"]);
  });

  it("season wins over recency", () => {
    const seasonalJustWorn = outfit("seasonal", [garment("a", "SHIRT", { seasons: ["SUMMER"] })], {
      wornDates: ["2026-08-04T00:00:00Z"],
    });
    const offSeasonNeverWorn = outfit("off", [garment("b", "SWEATER", { seasons: ["WINTER"] })]);
    const ranked = rankOutfitsForToday([offSeasonNeverWorn, seasonalJustWorn], "SUMMER");
    expect(ranked.map((o) => o.id)).toEqual(["seasonal", "off"]);
  });

  it("does not mutate the input array", () => {
    const a = outfit("a", [garment("x", "SHIRT", { seasons: ["WINTER"] })]);
    const b = outfit("b", [garment("y", "SHIRT", { seasons: ["SUMMER"] })]);
    const input = [a, b];
    rankOutfitsForToday(input, "SUMMER");
    expect(input.map((o) => o.id)).toEqual(["a", "b"]);
  });
});
