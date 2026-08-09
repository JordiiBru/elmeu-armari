import { describe, it, expect } from "vitest";
import {
  isWashable,
  isDirty,
  dirtyGarmentsOf,
  outfitAvailability,
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
  primary: GarmentWithColors[],
  opts: { extras?: GarmentWithColors[]; wornDates?: string[] } = {},
): SavedOutfit {
  return {
    id,
    name: id,
    improvised: false,
    paletteId: 1,
    favorite: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    wornEvents: (opts.wornDates ?? []).map((date, i) => ({
      id: `worn-${id}-${i}`,
      date: new Date(date),
    })),
    garments: [
      ...primary.map((g) => ({ id: `og-${id}-${g.id}`, role: "primary" as const, garment: g })),
      ...(opts.extras ?? []).map((g) => ({
        id: `og-${id}-${g.id}`,
        role: "extra" as const,
        garment: g,
      })),
    ],
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

// ── dirtyGarmentsOf / outfitAvailability ──────────────────────────────────────

describe("outfitAvailability", () => {
  it("an outfit with no washable piece is ready", () => {
    const o = outfit("o1", [], {
      extras: [garment("s", "SHOES", { dirty: true }), garment("a", "ACCESSORI")],
    });
    expect(dirtyGarmentsOf(o)).toEqual([]);
    expect(outfitAvailability(o).status).toBe("ready");
  });

  it("all washable pieces clean is ready", () => {
    const o = outfit("o2", [garment("sh", "SHIRT"), garment("pa", "PANTS")]);
    expect(outfitAvailability(o)).toEqual({ status: "ready", blockedBy: [] });
  });

  it("exactly one dirty piece is almost, and names it", () => {
    const dirtyShirt = garment("sh", "SHIRT", { dirty: true });
    const o = outfit("o3", [dirtyShirt, garment("pa", "PANTS")]);
    const { status, blockedBy } = outfitAvailability(o);
    expect(status).toBe("almost");
    expect(blockedBy.map((g) => g.id)).toEqual(["sh"]);
  });

  it("two dirty pieces is blocked", () => {
    const o = outfit("o4", [
      garment("sh", "SHIRT", { dirty: true }),
      garment("pa", "PANTS", { dirty: true }),
      garment("sw", "SWEATER"),
    ]);
    const { status, blockedBy } = outfitAvailability(o);
    expect(status).toBe("blocked");
    expect(blockedBy).toHaveLength(2);
  });

  it("a dirty extra does not block, because extras are never washable", () => {
    const o = outfit("o5", [garment("sh", "SHIRT")], {
      extras: [garment("so", "SOCKS", { dirty: true })],
    });
    expect(outfitAvailability(o).status).toBe("ready");
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

  it("extras do not decide seasonality", () => {
    const o = outfit("o8", [garment("sh", "SHIRT", { seasons: ["SUMMER"] })], {
      extras: [garment("bo", "SHOES", { seasons: ["WINTER"] })],
    });
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
