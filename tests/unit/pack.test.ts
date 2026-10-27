import { describe, it, expect } from "vitest";
import { planTrip, tripDays, weatherFor, MAX_TRIP_DAYS } from "@/lib/outfits/pack";
import type { TripInput, TripPlan } from "@/lib/outfits/pack";
import { isoToDay } from "@/lib/outfits/week";
import { palettes } from "@/lib/colors";
import type { Category, GarmentWithColors } from "@/lib/prendas/types";

// Black and white are wildcards in the engine, so a wardrobe of them
// combines in every arrangement and the tests are about the schedule, not
// about colour. Rust + teal (Sanzo combination 1) is the coloured case.
const BLACK = "#000000";
const WHITE = "#ffffff";
const RUST = "#de4500";
const TEAL = "#29bdad";

function g(id: string, category: Category, hexes: string[] = [BLACK], length: string | null = null): GarmentWithColors {
  return {
    id,
    category,
    texture: null,
    pattern: null,
    fit: null,
    subtype: null,
    size: null,
    length,
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

const shirts = (n: number, hex = BLACK) =>
  Array.from({ length: n }, (_, i) => g(`shirt${i + 1}`, "SHIRT", [hex]));
const pants = (n: number, hex = WHITE) =>
  Array.from({ length: n }, (_, i) => g(`pants${i + 1}`, "PANTS", [hex]));

function input(overrides: Partial<TripInput> = {}): TripInput {
  return {
    start: isoToDay("2026-11-02"),
    end: isoToDay("2026-11-04"),
    weather: "hot",
    mode: "minimize",
    laundry: false,
    pool: [...shirts(6), ...pants(3)],
    shoes: [g("shoes1", "SHOES")],
    accessories: [],
    palettes,
    ...overrides,
  };
}

function plan(overrides: Partial<TripInput> = {}): TripPlan {
  const result = planTrip(input(overrides));
  if (typeof result === "string") throw new Error(`unexpected ${result}`);
  return result;
}

const ids = (garments: GarmentWithColors[] | null) => (garments ?? []).map((x) => x.id);
const ofCategory = (garments: GarmentWithColors[] | null, c: Category) =>
  (garments ?? []).filter((x) => x.category === c).map((x) => x.id);

describe("tripDays", () => {
  it("is inclusive of both ends", () => {
    const days = tripDays(isoToDay("2026-11-02"), isoToDay("2026-11-04"));
    expect(Array.isArray(days) && days.length).toBe(3);
  });

  it("refuses an end before the start and a trip over the limit", () => {
    expect(tripDays(isoToDay("2026-11-04"), isoToDay("2026-11-02"))).toBe("range");
    const start = isoToDay("2026-11-01");
    const end = new Date(start.getTime() + MAX_TRIP_DAYS * 86_400_000);
    expect(tripDays(start, end)).toBe("tooLong");
  });

  it("crosses the October clock change as whole days", () => {
    const days = tripDays(isoToDay("2026-10-24"), isoToDay("2026-10-26"));
    expect(Array.isArray(days) && days.map((d) => d.toISOString().slice(0, 10))).toEqual([
      "2026-10-24",
      "2026-10-25",
      "2026-10-26",
    ]);
  });
});

describe("planTrip", () => {
  it("returns one row per day and nights = days - 1", () => {
    const p = plan();
    expect(p.days.map((d) => d.date)).toEqual(["2026-11-02", "2026-11-03", "2026-11-04"]);
    expect(p.nights).toBe(2);
    expect(p.days.every((d) => d.outfit !== null && d.missing === null)).toBe(true);
  });

  it("every outfit has a top, trousers and shoes", () => {
    for (const day of plan().days) {
      expect(ofCategory(day.outfit, "PANTS")).toHaveLength(1);
      expect(ofCategory(day.outfit, "SHOES")).toHaveLength(1);
      expect(ofCategory(day.outfit, "SHIRT").length + ofCategory(day.outfit, "SWEATER").length).toBeGreaterThan(0);
    }
  });

  it("without laundry a top is worn once and trousers at most three times", () => {
    const p = plan({ end: isoToDay("2026-11-07") }); // 6 days
    const tops = p.days.flatMap((d) => ofCategory(d.outfit, "SHIRT"));
    expect(new Set(tops).size).toBe(tops.length);
    const pantsWorn = p.days.flatMap((d) => ofCategory(d.outfit, "PANTS"));
    const counts = new Map<string, number>();
    for (const id of pantsWorn) counts.set(id, (counts.get(id) ?? 0) + 1);
    expect(Math.max(...counts.values())).toBeLessThanOrEqual(3);
  });

  it("minimize packs the fewest trousers the limit allows", () => {
    const p = plan({ end: isoToDay("2026-11-07") }); // 6 days, 3 wears each
    const pantsWorn = new Set(p.days.flatMap((d) => ofCategory(d.outfit, "PANTS")));
    expect(pantsWorn.size).toBe(2);
    expect(p.packed.filter((x) => x.category === "PANTS")).toHaveLength(2);
  });

  it("noRepeat spreads over fresh trousers before repeating", () => {
    const p = plan({ mode: "noRepeat" });
    const pantsWorn = p.days.flatMap((d) => ofCategory(d.outfit, "PANTS"));
    expect(new Set(pantsWorn).size).toBe(3);
  });

  it("says which day runs out of tops instead of returning nothing", () => {
    const p = plan({ pool: [...shirts(2), ...pants(1)] });
    expect(p.days[0].outfit).not.toBeNull();
    expect(p.days[1].outfit).not.toBeNull();
    expect(p.days[2]).toMatchObject({ outfit: null, missing: "top" });
  });

  it("says when there are no shoes", () => {
    const p = plan({ shoes: [] });
    expect(p.days.every((d) => d.missing === "shoes")).toBe(true);
  });

  it("says when trousers run out", () => {
    const p = plan({ pool: [...shirts(6), ...pants(1)], end: isoToDay("2026-11-05") });
    expect(p.days.slice(0, 3).every((d) => d.outfit !== null)).toBe(true);
    expect(p.days[3].missing).toBe("pants");
  });

  it("says when what is left does not combine in colour", () => {
    const p = plan({
      // A taupe has no Sanzo reading, so it combines with nothing.
      pool: [g("rust", "SHIRT", [RUST]), g("teal", "PANTS", [TEAL]), g("taupe", "SHIRT", ["#8b7d72"])],
      shoes: [g("shoesT", "SHOES", [TEAL])],
      end: isoToDay("2026-11-03"),
    });
    expect(ids(p.days[0].outfit)).toContain("rust");
    expect(p.days[1].missing).toBe("colour");
  });

  it("with laundry, washes every two days and reuses the washed tops", () => {
    const p = plan({ laundry: true, pool: [...shirts(2), ...pants(1)], end: isoToDay("2026-11-07") });
    expect(p.days.every((d) => d.outfit !== null)).toBe(true);
    expect(p.laundry.map((s) => s.after)).toEqual(["2026-11-03", "2026-11-05"]);
    // Everything worn since the last wash goes in, trousers included.
    expect(ids(p.laundry[0].garments).sort()).toEqual(["pants1", "shirt1", "shirt2"]);
    expect(p.packed.filter((x) => x.category === "SHIRT")).toHaveLength(2);
  });

  it("never washes after the last day, and does nothing without the checkbox", () => {
    expect(plan({ laundry: true, end: isoToDay("2026-11-03") }).laundry).toEqual([]);
    expect(plan({ end: isoToDay("2026-11-07") }).laundry).toEqual([]);
  });

  it("chooses per day the pair of shoes that matches best", () => {
    const p = plan({
      pool: [g("rust", "SHIRT", [RUST]), g("teal", "PANTS", [TEAL])],
      shoes: [g("crimson", "SHOES", ["#d60036"]), g("rustShoes", "SHOES", [RUST])],
      end: isoToDay("2026-11-02"),
    });
    expect(ofCategory(p.days[0].outfit, "SHOES")).toEqual(["rustShoes"]);
  });

  it("flags fewer pairs of shoes than days", () => {
    expect(plan().shoesRepeat).toBe(true);
    expect(plan({ end: isoToDay("2026-11-02") }).shoesRepeat).toBe(false);
  });

  it("adds a coat every day in the cold, never in the heat", () => {
    const coat = g("coat", "OUTERWEAR");
    const cold = plan({ weather: "cold", pool: [...shirts(3), ...pants(1), coat] });
    expect(cold.days.every((d) => d.coat?.id === "coat")).toBe(true);
    const hot = plan({ pool: [...shirts(3), ...pants(1), coat] });
    expect(hot.days.every((d) => d.coat === null)).toBe(true);
    expect(hot.packed.some((x) => x.id === "coat")).toBe(false);
  });

  it("with no coat in the pool, a cold day simply has none", () => {
    const p = plan({ weather: "cold" });
    expect(p.days.every((d) => d.outfit !== null && d.coat === null)).toBe(true);
  });

  it("in the cold, layers a sweater over a shirt every day it can", () => {
    const sweaters = Array.from({ length: 3 }, (_, i) => g(`sweater${i + 1}`, "SWEATER", [BLACK]));
    const p = plan({ weather: "cold", pool: [...shirts(3), ...sweaters, ...pants(1)] });
    for (const day of p.days) {
      expect(ofCategory(day.outfit, "SHIRT")).toHaveLength(1);
      expect(ofCategory(day.outfit, "SWEATER")).toHaveLength(1);
    }
  });

  it("puts a shirt under a sweater whenever it is not hot", () => {
    const sweaters = Array.from({ length: 3 }, (_, i) => g(`sweater${i + 1}`, "SWEATER", [BLACK]));
    const mixed = plan({ weather: "mixed", pool: [...shirts(6), ...sweaters, ...pants(1)] });
    for (const day of mixed.days) {
      if (ofCategory(day.outfit, "SWEATER").length > 0) {
        expect(ofCategory(day.outfit, "SHIRT")).toHaveLength(1);
      }
    }
    const hot = plan({ pool: [...shirts(6), ...sweaters, ...pants(1)] });
    expect(hot.days.every((d) => ofCategory(d.outfit, "SHIRT").length + ofCategory(d.outfit, "SWEATER").length === 1)).toBe(true);
  });

  it("never layers at the cost of a later day without a top", () => {
    const p = plan({ weather: "cold", pool: [...shirts(2), g("sweater", "SWEATER", [BLACK]), ...pants(1)] });
    expect(p.days.every((d) => d.outfit !== null)).toBe(true);
  });

  it("in mixed weather, the coat goes with the sweater days", () => {
    const p = plan({
      weather: "mixed",
      pool: [g("sweater", "SWEATER", [BLACK]), g("shirt", "SHIRT", [BLACK]), ...pants(1), g("coat", "OUTERWEAR")],
      end: isoToDay("2026-11-03"),
    });
    for (const day of p.days) {
      const sweaterDay = ofCategory(day.outfit, "SWEATER").length > 0;
      expect(day.coat !== null).toBe(sweaterDay);
    }
  });

  it("sinks shorts in the cold and sweaters in the heat", () => {
    const pool = [
      g("shorts", "PANTS", [WHITE], "SHORT"),
      g("long", "PANTS", [WHITE], "LONG"),
      g("sweater", "SWEATER", [BLACK]),
      g("tee", "SHIRT", [BLACK]),
    ];
    const cold = plan({ weather: "cold", pool, end: isoToDay("2026-11-02") });
    expect(ofCategory(cold.days[0].outfit, "PANTS")).toEqual(["long"]);
    const hot = plan({ pool, end: isoToDay("2026-11-02") });
    expect(ofCategory(hot.days[0].outfit, "SWEATER")).toEqual([]);
  });

  it("proposes looks not shown yet when asked again", () => {
    const week = { pool: [...shirts(6), ...pants(3)], mode: "noRepeat" as const };
    const first = plan(week);
    const seen = new Set(first.days.flatMap((d) => (d.look ? [d.look] : [])));
    const second = plan({ ...week, seen });
    expect(second.days.every((d) => d.look !== null && !seen.has(d.look))).toBe(true);
  });

  it("never packs more pieces to show something new", () => {
    const first = plan({ end: isoToDay("2026-11-07") });
    const seen = new Set(first.days.flatMap((d) => (d.look ? [d.look] : [])));
    expect(plan({ end: isoToDay("2026-11-07"), seen }).packed.length).toBe(first.packed.length);
  });

  it("ignores the clean/dirty state of the wardrobe", () => {
    const dirty = shirts(3).map((s) => ({ ...s, dirtySince: new Date("2026-10-01T00:00:00Z") }));
    const p = plan({ pool: [...dirty, ...pants(1)] });
    expect(p.days.every((d) => d.outfit !== null)).toBe(true);
  });

  it("says a piece without colour instead of a colour mismatch", () => {
    const result = planTrip(input({ pool: [g("shirt-blank", "SHIRT", []), ...pants(2)] }));
    if (typeof result === "string") throw new Error(result);
    expect(result.days[0].missing).toBe("uncoloured");
  });

  it("returns the range error instead of a plan", () => {
    expect(planTrip(input({ start: isoToDay("2026-11-04"), end: isoToDay("2026-11-02") }))).toBe("range");
  });
});

describe("accessories steer the palette", () => {
  // Teal completes the palette of the teal shirt, so the bag makes the planner
  // pick that look on the day it can be worn, without packing another piece.
  const bag = g("bag1", "ACCESSORI", [TEAL]);
  const pool = [g("shirt-rust", "SHIRT", [RUST]), g("shirt-teal", "SHIRT", [TEAL]), g("shirt-black", "SHIRT", [BLACK]), ...pants(3)];
  const range = { end: isoToDay("2026-11-04") };

  it("wears the packed accessory on a day its colour completes", () => {
    const withBag = plan({ pool, accessories: [bag], ...range });
    expect(withBag.days.some((d) => ids(d.accessories).includes("bag1"))).toBe(true);
    expect(ids(withBag.packed)).toContain("bag1");
  });

  it("never packs an extra piece to make the accessory fit", () => {
    const withBag = plan({ pool, accessories: [bag], ...range });
    const without = plan({ pool, accessories: [], ...range });
    const clothes = (p: TripPlan) => p.packed.filter((x) => x.category !== "ACCESSORI").length;
    expect(clothes(withBag)).toBe(clothes(without));
  });
});

describe("weatherFor", () => {
  it("reads the weather from the pieces packed", () => {
    expect(weatherFor([g("s", "SHIRT")])).toBe("hot");
    expect(weatherFor([g("s", "SHIRT"), g("c", "OUTERWEAR")])).toBe("cold");
    expect(weatherFor([g("s", "SHIRT"), g("j", "SWEATER")])).toBe("mixed");
    expect(weatherFor([g("j", "SWEATER"), g("c", "OUTERWEAR")])).toBe("mixed");
  });
});
