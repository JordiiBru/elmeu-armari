import { describe, it, expect } from "vitest";
import { generateOutfitGroups } from "./engine";
import { palettes } from "@/lib/colors";
import type { GarmentWithColors } from "@/lib/prendas/types";

// Real Sanzo Wada hexes, not invented ones. `buildContext` snaps a
// garment's colour against the real 157-canonical catalogue and
// intersects real combination ids — a synthetic palette array with its
// own made-up ids (the previous version of this file) never lines up
// with that, so every "this should match" assertion silently asserted
// against zero groups. Caught only once this file was actually wired
// into `vitest.config.ts`'s `include`, which it wasn't before.
//
// Combination 1: rust + teal.
const RUST = "#de4500";
const TEAL = "#29bdad";
// Combination 122: crimson + amber + green — three colours, so there's
// a slot left over for a third piece (a shoe) to land on.
const CRIMSON = "#d60036";
const AMBER = "#ffb852";
const GREEN = "#00d973";
const BLACK = "#000000";

function createTestGarment(
  id: string,
  category: "SHIRT" | "SWEATER" | "PANTS" | "SOCKS" | "SHOES",
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

    it("excludes socks from outfit generation", () => {
      const shirt = createTestGarment("1", "SHIRT", [RUST]);
      const sock = createTestGarment("2", "SOCKS", [TEAL]);
      const pants = createTestGarment("3", "PANTS", [TEAL]);

      const { groups } = generateOutfitGroups([shirt, sock, pants], palettes);

      const hasShirtAndPants = groups.some((g) => {
        const cats = g.garments.map((gar) => gar.category);
        return cats.includes("SHIRT") && cats.includes("PANTS") && !cats.includes("SOCKS");
      });
      expect(hasShirtAndPants).toBe(true);

      const outfitWithSocks = groups.some((g) =>
        g.garments.some((gar) => gar.category === "SOCKS"),
      );
      expect(outfitWithSocks).toBe(false);
    });

    it("enforces no-repeated-category rule", () => {
      const shirt1 = createTestGarment("1", "SHIRT", [RUST]);
      const shirt2 = createTestGarment("2", "SHIRT", [CRIMSON]);
      const pants = createTestGarment("3", "PANTS", [TEAL]);

      const { groups } = generateOutfitGroups([shirt1, shirt2, pants], palettes);

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
      // Same colour twice occupies one palette slot, however many
      // palettes contain black — MIN_DISTINCT_PALETTE_COLORS is 2.
      const blackShirt = createTestGarment("1", "SHIRT", [BLACK]);
      const blackPants = createTestGarment("2", "PANTS", [BLACK]);

      const { groups } = generateOutfitGroups([blackShirt, blackPants], palettes);
      expect(groups).toHaveLength(0);
    });

    it("accepts outfits that use at least MIN_DISTINCT_PALETTE_COLORS slots", () => {
      const shirt = createTestGarment("1", "SHIRT", [RUST]);
      const pants = createTestGarment("2", "PANTS", [TEAL]);

      const { groups } = generateOutfitGroups([shirt, pants], palettes);

      expect(groups.length).toBeGreaterThan(0);
      const outfit = groups[0];
      expect(outfit.garments).toHaveLength(2);
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

    it("still forms a valid outfit with no matching shoe in the wardrobe", () => {
      const shirt = createTestGarment("1", "SHIRT", [CRIMSON]);
      const pants = createTestGarment("2", "PANTS", [AMBER]);

      const { groups } = generateOutfitGroups([shirt, pants], palettes);

      expect(groups.length).toBeGreaterThan(0);
      expect(groups[0].garments.map((g) => g.category)).not.toContain("SHOES");
    });

    it("keeps sweater-anchored groups in normal order when in season", () => {
      const sweater = createTestGarment("sw", "SWEATER", [RUST]);
      const pantsA = createTestGarment("pa", "PANTS", [TEAL]);
      const shirt = createTestGarment("sh", "SHIRT", [CRIMSON]);
      const pantsB = createTestGarment("pb", "PANTS", [AMBER]);

      const { groups } = generateOutfitGroups(
        [sweater, pantsA, shirt, pantsB],
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
      const shirt = createTestGarment("sh", "SHIRT", [CRIMSON]);
      const pantsB = createTestGarment("pb", "PANTS", [AMBER]);

      const { groups } = generateOutfitGroups(
        [sweater, pantsA, shirt, pantsB],
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

      const { groups } = generateOutfitGroups(
        [shirt, shorts],
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
      const shirtB = createTestGarment("sb", "SHIRT", [CRIMSON]);
      const longPants = createTestGarment("pl", "PANTS", [AMBER], "LONG");

      const { groups } = generateOutfitGroups(
        [shirtA, shorts, shirtB, longPants],
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
