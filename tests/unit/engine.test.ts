import { describe, it, expect } from "vitest";
import { generateOutfitGroups, generateOutfitGroupsForGarment, candidatesFor } from "@/lib/outfits/engine";
import { MEMBERSHIP_THRESHOLD, OKLCH_DISTANCE_THRESHOLD } from "@/lib/outfits/color-matching";
import { ANCHOR_CASES } from "@/lib/outfits/anchor-reference";
import { palettes } from "@/lib/colors";
import { EXTRA_CATEGORIES } from "@/lib/prendas/types";
import type { Category, GarmentWithColors } from "@/lib/prendas/types";

// Real Sanzo Wada hexes, not invented ones. `buildContext` snaps a
// garment's colour against the real 157-canonical catalogue and
// intersects real combination ids — a synthetic palette array with its
// own made-up ids (the previous version of this file) never lines up
// with that, so every "this should match" assertion silently asserted
// against zero groups. Caught only once this file was actually wired
// into `vitest.config.ts`'s `include`, which it wasn't before.
//
// Combination 1: rust + teal. The shoe reuses rust exactly — repeating
// a colour is legal, and it's simplest way to hand this combination a
// shoe that's guaranteed to intersect it.
const RUST = "#de4500";
const TEAL = "#29bdad";
const SHOE_FOR_RUST_TEAL = RUST;
// Combination 122: crimson + amber + green — three colours, so a shirt,
// pants and shoe can each take a different one.
const CRIMSON = "#d60036";
const AMBER = "#ffb852";
const GREEN = "#00d973";
const BLACK = "#000000";

function createTestGarment(
  id: string,
  category: Category,
  hexColors: string[],
  length: string | null = null,
): GarmentWithColors {
  return {
    id,
    category,
    texture: "COTTON",
    pattern: "PLAIN",
    fit: "REGULAR",
    subtype: null,
    size: "M",
    length,
    notes: null,
    image: null,
    dirtySince: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    colors: hexColors.map((hex, idx) => ({
      id: `color-${id}-${idx}`,
      hex,
    })),
    seasons: [],
  };
}

describe("engine", () => {
  describe("generateOutfitGroups", () => {
    it("returns empty groups when given no garments", () => {
      const { groups } = generateOutfitGroups([], palettes);
      expect(groups).toHaveLength(0);
    });

    it("requires at least 2 pieces for a valid outfit", () => {
      const singleGarment = createTestGarment("1", "SHIRT", [RUST]);

      const { groups } = generateOutfitGroups([singleGarment], palettes);
      expect(groups).toHaveLength(0);
    });

    it("never puts an extra category (accessories) in a group", () => {
      // Every extra category, coloured to match the outfit it sits next
      // to, so the only thing keeping it out is the exclusion itself.
      const extras = [...EXTRA_CATEGORIES].map((c, i) =>
        createTestGarment(`extra-${i}`, c, [RUST]),
      );
      const shirt = createTestGarment("shirt", "SHIRT", [RUST]);
      const pants = createTestGarment("pants", "PANTS", [TEAL]);
      const shoe = createTestGarment("shoe", "SHOES", [SHOE_FOR_RUST_TEAL]);
      const wardrobe = [shirt, pants, shoe, ...extras];

      const { groups } = generateOutfitGroups(wardrobe, palettes);
      expect(groups.length).toBeGreaterThan(0);
      for (const g of groups) {
        for (const gar of g.garments) expect(EXTRA_CATEGORIES.has(gar.category)).toBe(false);
      }

      // Anchoring on the shirt goes through the other entry point.
      const { groups: forShirt } = generateOutfitGroupsForGarment(shirt, wardrobe, palettes);
      expect(forShirt.length).toBeGreaterThan(0);
      for (const g of forShirt) {
        for (const gar of g.garments) expect(EXTRA_CATEGORIES.has(gar.category)).toBe(false);
      }

      // And an extra can never be the anchor.
      for (const extra of extras) {
        expect(generateOutfitGroupsForGarment(extra, wardrobe, palettes).groups).toHaveLength(0);
      }
    });

    it("enforces no-repeated-category rule", () => {
      const shirt1 = createTestGarment("1", "SHIRT", [RUST]);
      const shirt2 = createTestGarment("2", "SHIRT", [CRIMSON]);
      const pants = createTestGarment("3", "PANTS", [TEAL]);
      const shoe = createTestGarment("4", "SHOES", [SHOE_FOR_RUST_TEAL]);

      const { groups } = generateOutfitGroups([shirt1, shirt2, pants, shoe], palettes);

      // Real match (rust + teal), so this is checking the rule against
      // groups that genuinely exist, not vacuously against zero of them.
      expect(groups.length).toBeGreaterThan(0);
      const hasBothShirts = groups.some((g) => {
        const ids = g.garments.map((gar) => gar.id);
        return ids.includes("1") && ids.includes("2");
      });
      expect(hasBothShirts).toBe(false);
    });

    it("enforces MIN_DISTINCT_PALETTE_COLORS requirement", () => {
      // Same colour three times over occupies one palette slot, however
      // many palettes contain black — MIN_DISTINCT_PALETTE_COLORS is 2.
      // A matching shoe is included so this fails on that rule alone,
      // not on the (also true) absence of one.
      const blackShirt = createTestGarment("1", "SHIRT", [BLACK]);
      const blackPants = createTestGarment("2", "PANTS", [BLACK]);
      const blackShoe = createTestGarment("3", "SHOES", [BLACK]);

      const { groups } = generateOutfitGroups(
        [blackShirt, blackPants, blackShoe],
        palettes,
      );
      expect(groups).toHaveLength(0);
    });

    it("accepts outfits that use at least MIN_DISTINCT_PALETTE_COLORS slots", () => {
      const shirt = createTestGarment("1", "SHIRT", [RUST]);
      const pants = createTestGarment("2", "PANTS", [TEAL]);
      const shoe = createTestGarment("3", "SHOES", [SHOE_FOR_RUST_TEAL]);

      const { groups } = generateOutfitGroups([shirt, pants, shoe], palettes);

      expect(groups.length).toBeGreaterThan(0);
      const outfit = groups[0];
      expect(outfit.garments).toHaveLength(3);
      expect(outfit.palettes.length).toBeGreaterThan(0);
      expect(outfit.palettes[0].totalDistance).toBe(0);
    });

    it("requires both a top and a bottom piece", () => {
      const shirt1 = createTestGarment("1", "SHIRT", [RUST]);
      const shirt2 = createTestGarment("2", "SWEATER", [TEAL]);

      const { groups } = generateOutfitGroups([shirt1, shirt2], palettes);

      expect(groups).toHaveLength(0);
    });

    it("includes a matching shoe as a normal member of the outfit", () => {
      const shirt = createTestGarment("1", "SHIRT", [CRIMSON]);
      const pants = createTestGarment("2", "PANTS", [AMBER]);
      const shoe = createTestGarment("3", "SHOES", [GREEN]);

      const { groups } = generateOutfitGroups([shirt, pants, shoe], palettes);

      const withShoe = groups.find((g) => g.garments.some((x) => x.id === "3"));
      expect(withShoe).toBeDefined();
      expect(withShoe?.garments.map((g) => g.category)).toContain("SHOES");
    });

    it("shoes are a must: no group forms when no shoe is in the wardrobe at all", () => {
      const shirt = createTestGarment("1", "SHIRT", [CRIMSON]);
      const pants = createTestGarment("2", "PANTS", [AMBER]);

      const { groups } = generateOutfitGroups([shirt, pants], palettes);

      expect(groups).toHaveLength(0);
    });

    it("falls back to a black or white shoe when no real shoe match exists", () => {
      // Rust + teal (combination 1) has no black/white anchor of its
      // own — confirmed by inspecting colorAssignments directly: a black
      // shoe here has none, which is exactly the free pass in action,
      // not a coincidental real match.
      const shirt = createTestGarment("1", "SHIRT", [RUST]);
      const pants = createTestGarment("2", "PANTS", [TEAL]);
      const blackShoe = createTestGarment("3", "SHOES", [BLACK]);

      const { groups } = generateOutfitGroups([shirt, pants, blackShoe], palettes);

      const withShoe = groups.find((g) => g.garments.some((x) => x.id === "3"));
      expect(withShoe).toBeDefined();
      const primary = withShoe?.palettes[0];
      const shoeAssignment = primary?.colorAssignments.find((a) => a.garmentId === "3");
      expect(shoeAssignment).toBeUndefined();
      // The outfit itself is still a real, tight match — only the shoe
      // rode in for free, not the whole group.
      expect(primary?.colorAssignments.length).toBeGreaterThanOrEqual(2);
    });

    it("keeps sweater-anchored groups in normal order when in season", () => {
      const sweater = createTestGarment("sw", "SWEATER", [RUST]);
      const pantsA = createTestGarment("pa", "PANTS", [TEAL]);
      const shoeA = createTestGarment("shA", "SHOES", [SHOE_FOR_RUST_TEAL]);
      const shirt = createTestGarment("sh", "SHIRT", [CRIMSON]);
      const pantsB = createTestGarment("pb", "PANTS", [AMBER]);
      const shoeB = createTestGarment("shB", "SHOES", [GREEN]);

      const { groups } = generateOutfitGroups(
        [sweater, pantsA, shoeA, shirt, pantsB, shoeB],
        palettes,
        50,
        0,
        true,
      );

      expect(groups.some((g) => g.garments.some((x) => x.category === "SWEATER"))).toBe(true);
    });

    it("sinks every sweater-anchored group behind non-sweater ones when out of season", () => {
      const sweater = createTestGarment("sw", "SWEATER", [RUST]);
      const pantsA = createTestGarment("pa", "PANTS", [TEAL]);
      const shoeA = createTestGarment("shA", "SHOES", [SHOE_FOR_RUST_TEAL]);
      const shirt = createTestGarment("sh", "SHIRT", [CRIMSON]);
      const pantsB = createTestGarment("pb", "PANTS", [AMBER]);
      const shoeB = createTestGarment("shB", "SHOES", [GREEN]);

      const { groups } = generateOutfitGroups(
        [sweater, pantsA, shoeA, shirt, pantsB, shoeB],
        palettes,
        50,
        0,
        false,
      );

      const hasSweater = groups.map((g) => g.garments.some((x) => x.category === "SWEATER"));
      const lastNonSweater = hasSweater.lastIndexOf(false);
      const firstSweater = hasSweater.indexOf(true);
      expect(firstSweater).toBeGreaterThan(-1);
      expect(lastNonSweater).toBeGreaterThan(-1);
      expect(firstSweater).toBeGreaterThan(lastNonSweater);
    });

    it("keeps shorts-anchored groups in normal order in season", () => {
      const shirt = createTestGarment("sh", "SHIRT", [RUST]);
      const shorts = createTestGarment("po", "PANTS", [TEAL], "SHORT");
      const shoe = createTestGarment("shoe", "SHOES", [SHOE_FOR_RUST_TEAL]);

      const { groups } = generateOutfitGroups(
        [shirt, shorts, shoe],
        palettes,
        50,
        0,
        true,
        true,
      );

      expect(groups.some((g) => g.garments.some((x) => x.id === "po"))).toBe(true);
    });

    it("sinks every shorts-anchored group behind non-shorts ones out of season", () => {
      const shirtA = createTestGarment("sa", "SHIRT", [RUST]);
      const shorts = createTestGarment("po", "PANTS", [TEAL], "SHORT");
      const shoeA = createTestGarment("shA", "SHOES", [SHOE_FOR_RUST_TEAL]);
      const shirtB = createTestGarment("sb", "SHIRT", [CRIMSON]);
      const longPants = createTestGarment("pl", "PANTS", [AMBER], "LONG");
      const shoeB = createTestGarment("shB", "SHOES", [GREEN]);

      const { groups } = generateOutfitGroups(
        [shirtA, shorts, shoeA, shirtB, longPants, shoeB],
        palettes,
        50,
        0,
        true,
        false,
      );

      const hasShorts = groups.map((g) => g.garments.some((x) => x.id === "po"));
      const lastNonShorts = hasShorts.lastIndexOf(false);
      const firstShorts = hasShorts.indexOf(true);
      expect(firstShorts).toBeGreaterThan(-1);
      expect(lastNonShorts).toBeGreaterThan(-1);
      expect(firstShorts).toBeGreaterThan(lastNonShorts);
    });
  });

  describe("palette membership", () => {
    it("is stricter than the vocabulary threshold", () => {
      expect(MEMBERSHIP_THRESHOLD).toBeLessThan(OKLCH_DISTANCE_THRESHOLD);
    });

    it("keeps the nearest reading and only readings within the threshold besides it", () => {
      for (const c of ANCHOR_CASES) {
        const candidates = candidatesFor(c.hex);
        candidates.forEach((cand, i) => {
          if (i > 0) expect(cand.distance, `${c.hex} ${cand.canonical.name}`).toBeLessThan(MEMBERSHIP_THRESHOLD);
        });
      }
    });

    // A pink that is 8 from Hermosa Pink and 12.5 from Light Brown Drab: at
    // the strict threshold it only lives in Hermosa Pink's palettes, which
    // share none with the Light Brown Drab trousers and shoes.
    const PINK = "#dda1d1";
    const DRAB = "#b08699";
    // A shirt that goes with the trousers and shoes at the strict threshold:
    // the other colour of a palette that has the Light Brown Drab.
    const drabPalette = palettes.find((p) => p.colores.includes(DRAB) && p.colores.length >= 2)!;
    const PARTNER = drabPalette.colores.find((h) => h !== DRAB)!;

    it("tops a small wardrobe up from the vocabulary threshold instead of emptying it", () => {
      const wardrobe = [
        createTestGarment("shirt", "SHIRT", [PINK]),
        createTestGarment("pants", "PANTS", [DRAB]),
        createTestGarment("shoes", "SHOES", [DRAB]),
      ];
      const { groups } = generateOutfitGroups(wardrobe, palettes);
      expect(groups).toHaveLength(1);
      const { groups: forShirt } = generateOutfitGroupsForGarment(wardrobe[0], wardrobe, palettes);
      expect(forShirt).toHaveLength(1);
    });

    it("ranks the strict groups ahead of the ones the top-up adds", () => {
      const wardrobe = [
        createTestGarment("exact", "SHIRT", [PARTNER]),
        createTestGarment("loose", "SHIRT", [PINK]),
        createTestGarment("pants", "PANTS", [DRAB]),
        createTestGarment("shoes", "SHOES", [DRAB]),
      ];
      const { groups } = generateOutfitGroups(wardrobe, palettes);
      const shirtOf = (i: number) => groups[i].garments.find((g) => g.category === "SHIRT")?.id;
      expect(groups).toHaveLength(2);
      expect(shirtOf(0)).toBe("exact");
      expect(shirtOf(1)).toBe("loose");
    });

    it("does not top up a wardrobe that already has enough strict groups", () => {
      // Five shirts that match the trousers and shoes exactly fill the
      // strict tier, so the pink, which only fits loosely, stays out.
      const shirts = Array.from({ length: 5 }, (_, i) => createTestGarment(`exact${i}`, "SHIRT", [PARTNER]));
      const wardrobe = [
        ...shirts,
        createTestGarment("loose", "SHIRT", [PINK]),
        createTestGarment("pants", "PANTS", [DRAB]),
        createTestGarment("shoes", "SHOES", [DRAB]),
      ];
      const { groups } = generateOutfitGroups(wardrobe, palettes, 100);
      expect(groups).toHaveLength(5);
      expect(groups.some((g) => g.garments.some((x) => x.id === "loose"))).toBe(false);
    });
  });

  describe("anchoring every colour of a piece", () => {
    it("gives a two-colour piece one anchor per colour and scores them all", () => {
      // Combination 1 is rust + teal: a shirt in both colours has an anchor
      // for each, and used to be scored on the first alone.
      const shirt = createTestGarment("shirt", "SHIRT", [RUST, TEAL]);
      const pants = createTestGarment("pants", "PANTS", [TEAL]);
      const shoes = createTestGarment("shoes", "SHOES", [SHOE_FOR_RUST_TEAL]);

      const { groups } = generateOutfitGroups([shirt, pants, shoes], palettes);
      const primary = groups[0].palettes[0];
      const shirtAnchors = primary.colorAssignments.filter((a) => a.garmentId === "shirt");
      expect(shirtAnchors).toHaveLength(2);
      expect(new Set(shirtAnchors.map((a) => a.paletteColorIndex)).size).toBe(2);
      expect(primary.unanchored).toBe(0);
      const summed = primary.colorAssignments.reduce((sum, a) => sum + a.distance, 0);
      expect(primary.totalDistance).toBeCloseTo(summed, 8);
    });

    it("charges a fixed penalty for a colour with no anchor, and counts it", () => {
      // The black shoe rides in for free in rust + teal, which has no black.
      const shirt = createTestGarment("shirt", "SHIRT", [RUST]);
      const pants = createTestGarment("pants", "PANTS", [TEAL]);
      const blackShoe = createTestGarment("shoes", "SHOES", [BLACK]);

      const { groups } = generateOutfitGroups([shirt, pants, blackShoe], palettes);
      const primary = groups[0].palettes[0];
      expect(primary.unanchored).toBe(1);
      expect(primary.totalDistance).toBeGreaterThanOrEqual(OKLCH_DISTANCE_THRESHOLD);
    });

    it("never lets an unanchored piece score better than an anchored one", () => {
      const shirt = createTestGarment("shirt", "SHIRT", [RUST]);
      const pants = createTestGarment("pants", "PANTS", [TEAL]);
      const rustShoe = createTestGarment("shoes", "SHOES", [SHOE_FOR_RUST_TEAL]);
      const blackShoe = createTestGarment("shoes", "SHOES", [BLACK]);

      const anchored = generateOutfitGroups([shirt, pants, rustShoe], palettes).groups[0];
      const free = generateOutfitGroups([shirt, pants, blackShoe], palettes).groups[0];
      expect(anchored.palettes[0].unanchored).toBe(0);
      expect(anchored.bestDistance).toBeLessThan(free.bestDistance);
    });
  });

  describe("diversified ranking", () => {
    // Combination 122 is crimson + amber + green. Three shirts, two trousers
    // and two pairs of shoes, every one an exact match, make twelve equally
    // good groups: the plain ranking would list them in an arbitrary order,
    // one look with a piece swapped at a time.
    function wardrobe() {
      return [
        createTestGarment("s1", "SHIRT", [CRIMSON]),
        createTestGarment("s2", "SHIRT", [CRIMSON]),
        createTestGarment("s3", "SHIRT", [CRIMSON]),
        createTestGarment("p1", "PANTS", [AMBER]),
        createTestGarment("p2", "PANTS", [AMBER]),
        createTestGarment("h1", "SHOES", [GREEN]),
        createTestGarment("h2", "SHOES", [GREEN]),
      ];
    }
    const shared = (a: { garments: { id: string }[] }, b: { garments: { id: string }[] }) =>
      a.garments.filter((g) => b.garments.some((x) => x.id === g.id)).length;

    it("keeps every group: it reorders, it does not drop", () => {
      const { groups } = generateOutfitGroups(wardrobe(), palettes, 100);
      expect(groups).toHaveLength(12);
      expect(new Set(groups.map((g) => g.garments.map((x) => x.id).join(","))).size).toBe(12);
    });

    it("makes the first results differ in more than one piece", () => {
      const { groups } = generateOutfitGroups(wardrobe(), palettes, 100);
      // The first four can differ in two pieces each: no two of them may
      // share two of their three.
      const top = groups.slice(0, 4);
      for (let i = 0; i < top.length; i++) {
        for (let j = i + 1; j < top.length; j++) {
          expect(shared(top[i], top[j]), `${i} and ${j}`).toBeLessThanOrEqual(1);
        }
      }
    });

    it("still returns a result for the smallest wardrobe", () => {
      const small = wardrobe().filter((g) => ["s1", "p1", "h1"].includes(g.id));
      expect(generateOutfitGroups(small, palettes).groups).toHaveLength(1);
    });

    it("does not count the anchored piece as a similarity", () => {
      // Asking about s1: every group has s1, which says nothing about how
      // alike two of them are. All six groups are still there.
      const w = wardrobe();
      const { groups } = generateOutfitGroupsForGarment(w[0], w, palettes, 100);
      expect(groups).toHaveLength(4);
      expect(groups.every((g) => g.garments.some((x) => x.id === "s1"))).toBe(true);
    });
  });

  describe("black and white are wildcards", () => {
    const OFF_WHITE = "#fff0e0";
    const BROWN = "#6b4423";
    const PURPLE = "#7b1fa2";

    it("matches an off-white or white sweater with black trousers and a coloured shoe", () => {
      // White is in one of 348 Sanzo palettes and that one has no black: this
      // used to match nothing unless the shoe was black too.
      for (const sweater of [OFF_WHITE, "#ffffff", "#f4f1ea"]) {
        const wardrobe = [
          createTestGarment("sw", "SWEATER", [sweater]),
          createTestGarment("p", "PANTS", [BLACK]),
          createTestGarment("sh", "SHOES", [BROWN]),
        ];
        expect(generateOutfitGroups(wardrobe, palettes).groups, sweater).toHaveLength(1);
      }
    });

    it("cites the outfit on a palette that holds the coloured pieces", () => {
      const wardrobe = [
        createTestGarment("sw", "SWEATER", [OFF_WHITE]),
        createTestGarment("p", "PANTS", [BLACK]),
        createTestGarment("sh", "SHOES", [BROWN]),
      ];
      const { groups } = generateOutfitGroups(wardrobe, palettes);
      const shoeAssignments = groups[0].palettes[0].colorAssignments.filter(
        (a) => a.garmentId === "sh",
      );
      expect(shoeAssignments.length).toBeGreaterThan(0);
    });

    it("does not let a neutral make two unrelated coloured pieces compatible", () => {
      // Teal and purple share no Sanzo palette, not even at the loose
      // fallback threshold; black trousers must not bridge them.
      const wardrobe = [
        createTestGarment("s", "SHIRT", [PURPLE]),
        createTestGarment("p", "PANTS", [BLACK]),
        createTestGarment("sh", "SHOES", [TEAL]),
      ];
      expect(generateOutfitGroups(wardrobe, palettes).groups).toHaveLength(0);
    });

    it("lets an all-neutral outfit be a group, cited on a palette that has black", () => {
      const wardrobe = [
        createTestGarment("s", "SHIRT", ["#ffffff"]),
        createTestGarment("p", "PANTS", [BLACK]),
        createTestGarment("sh", "SHOES", [BLACK]),
      ];
      const { groups } = generateOutfitGroups(wardrobe, palettes);
      expect(groups).toHaveLength(1);
      expect(groups[0].palettes[0].palette.colores).toContain("#000000");
    });

    it("ranks a palette that really contains the neutral above one that only tolerates it", () => {
      // Brown with black trousers: some palettes have both brown and black
      // (black anchored), others only brown (black rides free, penalised).
      const wardrobe = [
        createTestGarment("s", "SHIRT", [BROWN]),
        createTestGarment("p", "PANTS", [BLACK]),
        createTestGarment("sh", "SHOES", [BROWN]),
      ];
      const { groups } = generateOutfitGroups(wardrobe, palettes);
      const matches = groups[0].palettes;
      expect(matches.length).toBeGreaterThan(0);
      const scores = matches.map((m) => m.unanchored);
      expect(scores).toEqual([...scores].sort((a, b) => a - b));
    });
  });
});

