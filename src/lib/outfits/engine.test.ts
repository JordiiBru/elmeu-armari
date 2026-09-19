import { describe, it, expect } from "vitest";
import { generateOutfitGroups, generateOutfitGroupsForGarment } from "./engine";
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
});
