import { describe, it, expect } from "vitest";
import {
  roleOf,
  narrowUniverse,
  nextRole,
  optionsForRole,
  reopenFrom,
  ROLE_ORDER,
  type Picks,
} from "@/lib/outfits/discoverPicker";
import type { OutfitGroup } from "@/lib/outfits/types";
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
    createdAt: new Date(0),
    updatedAt: new Date(0),
    colors: [],
    seasons: [],
  } as unknown as GarmentWithColors;
}

function group(...garments: GarmentWithColors[]): OutfitGroup {
  return { garments, palettes: [], bestDistance: 0 };
}

const sweater = garment("sweater", "SWEATER");
const shirt = garment("shirt", "SHIRT");
const pantsA = garment("pants-a", "PANTS");
const pantsB = garment("pants-b", "PANTS");
const shoesA = garment("shoes-a", "SHOES");
const shoesB = garment("shoes-b", "SHOES");

describe("roleOf", () => {
  it("maps sweater and shirt to the same TOP role", () => {
    expect(roleOf("SWEATER")).toBe("TOP");
    expect(roleOf("SHIRT")).toBe("TOP");
  });

  it("keeps pants and shoes as their own roles", () => {
    expect(roleOf("PANTS")).toBe("PANTS");
    expect(roleOf("SHOES")).toBe("SHOES");
  });
});

describe("nextRole", () => {
  it("starts at TOP when nothing is picked", () => {
    expect(nextRole({})).toBe("TOP");
  });

  it("skips straight to the role after the anchor when starting from pantalons", () => {
    // The exact case the picker opens on when tapped from a pair of
    // trousers: pantalons is already filled, top is the very next row.
    expect(nextRole({ PANTS: pantsA })).toBe("TOP");
  });

  it("returns null once every role is filled", () => {
    const picks: Picks = { TOP: sweater, PANTS: pantsA, SHOES: shoesA };
    expect(nextRole(picks)).toBeNull();
  });
});

describe("narrowUniverse", () => {
  const universe = [
    group(sweater, pantsA, shoesA),
    group(sweater, pantsB, shoesB),
    group(shirt, pantsA, shoesB),
  ];

  it("keeps every group when nothing is picked yet", () => {
    expect(narrowUniverse(universe, {})).toHaveLength(3);
  });

  it("drops groups that don't carry every already-picked garment", () => {
    const narrowed = narrowUniverse(universe, { PANTS: pantsA });
    expect(narrowed).toHaveLength(2);
    expect(narrowed.every((g) => g.garments.includes(pantsA))).toBe(true);
  });

  it("narrows to exactly the one group once every role is picked", () => {
    const narrowed = narrowUniverse(universe, {
      TOP: sweater,
      PANTS: pantsB,
      SHOES: shoesB,
    });
    expect(narrowed).toHaveLength(1);
    expect(narrowed[0].garments).toEqual([sweater, pantsB, shoesB]);
  });
});

describe("optionsForRole", () => {
  it("collects every distinct garment of that role across the alive groups", () => {
    const remaining = [group(sweater, pantsA, shoesA), group(shirt, pantsA, shoesB)];
    const options = optionsForRole(remaining, "SHOES");
    expect(options.map((g) => g.id).sort()).toEqual(["shoes-a", "shoes-b"]);
  });

  it("mixes sweaters and shirts into the one TOP role", () => {
    // This is what "starting from pantalons offers jersei o samarreta
    // in the same row" actually reduces to: TOP has no idea it's two
    // different categories underneath.
    const remaining = [group(sweater, pantsA, shoesA), group(shirt, pantsA, shoesA)];
    const options = optionsForRole(remaining, "TOP");
    expect(options.map((g) => g.id).sort()).toEqual(["shirt", "sweater"]);
  });

  it("never comes back empty for a role every remaining group actually has", () => {
    // The picker's core invariant: an option is only ever offered
    // because at least one alive group carries it, so a tap can never
    // walk into a dead end.
    const remaining = [group(sweater, pantsA, shoesA)];
    for (const role of ROLE_ORDER) {
      expect(optionsForRole(remaining, role).length).toBeGreaterThan(0);
    }
  });

  it("dedupes the same garment appearing in more than one group", () => {
    const remaining = [group(sweater, pantsA, shoesA), group(sweater, pantsB, shoesA)];
    expect(optionsForRole(remaining, "TOP")).toHaveLength(1);
  });
});

describe("reopenFrom", () => {
  it("clears the reopened role and everything after it in ROLE_ORDER", () => {
    const picks: Picks = { TOP: sweater, PANTS: pantsA, SHOES: shoesA };
    const next = reopenFrom(picks, "PANTS", "TOP");
    expect(next).toEqual({ TOP: sweater });
  });

  it("never clears the anchor, even when the reopened role sits earlier in ROLE_ORDER than it", () => {
    // The regression this module exists to pin down: starting from
    // pantalons makes PANTS the anchor even though TOP comes first in
    // ROLE_ORDER. Reopening TOP used to sweep PANTS away too, because
    // the clearing pass only checked position in ROLE_ORDER — not
    // which role was actually the one the picker was opened on.
    const anchor = "PANTS";
    const picks: Picks = { PANTS: pantsA, TOP: sweater, SHOES: shoesA };
    const next = reopenFrom(picks, "TOP", anchor);
    expect(next).toEqual({ PANTS: pantsA });
  });

  it("leaves every pick untouched when reopening the last role", () => {
    const picks: Picks = { TOP: sweater, PANTS: pantsA, SHOES: shoesA };
    const next = reopenFrom(picks, "SHOES", "TOP");
    expect(next).toEqual({ TOP: sweater, PANTS: pantsA });
  });
});

describe("end to end: starting from pantalons", () => {
  it("walks TOP then SHOES down to exactly one group, without ever losing the anchor", () => {
    const universe = [
      group(sweater, pantsA, shoesA),
      group(shirt, pantsA, shoesB),
      group(sweater, pantsB, shoesB),
    ];
    let picks: Picks = { PANTS: pantsA };

    let role = nextRole(picks);
    expect(role).toBe("TOP");
    let remaining = narrowUniverse(universe, picks);
    expect(optionsForRole(remaining, role!).map((g) => g.id).sort()).toEqual(["shirt", "sweater"]);
    picks = { ...picks, [role!]: shirt };

    role = nextRole(picks);
    expect(role).toBe("SHOES");
    remaining = narrowUniverse(universe, picks);
    expect(optionsForRole(remaining, role!).map((g) => g.id)).toEqual(["shoes-b"]);
    picks = { ...picks, [role!]: shoesB };

    expect(nextRole(picks)).toBeNull();
    remaining = narrowUniverse(universe, picks);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].garments).toEqual([shirt, pantsA, shoesB]);
  });
});
