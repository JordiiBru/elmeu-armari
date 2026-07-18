import { describe, it, expect } from "vitest";
import { generateOutfitGroups } from "./engine";
import type { GarmentWithColors } from "@/lib/prendas/types";
import type { SanzoPalette } from "./types";

// Minimal Sanzo palette set for testing. In reality loaded from sanzo-wada.json.
const testPalettes: SanzoPalette[] = [
  {
    id: 1,
    nombre: "Black + Grey",
    // Two achromatic greys + black
    colores: ["#000000", "#808080", "#ffffff"],
  },
  {
    id: 2,
    nombre: "Red + Orange",
    // Saturated red and orange
    colores: ["#ff0000", "#ff8800", "#ffcccc"],
  },
  {
    id: 3,
    nombre: "Green + Teal",
    colores: ["#008000", "#008080", "#ccffcc"],
  },
];

// Helper to create test garments with correct types
function createTestGarment(
  id: string,
  category: "SHIRT" | "SWEATER" | "PANTS" | "SOCKS" | "SHOES",
  hexColors: string[],
): GarmentWithColors {
  return {
    id,
    category,
    texture: "COTTON",
    pattern: "PLAIN",
    fit: "REGULAR",
    subtype: null,
    size: "M",
    length: null,
    notes: null,
    image: null,
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
      const { groups } = generateOutfitGroups([], testPalettes);
      expect(groups).toHaveLength(0);
    });

    it("requires at least 2 pieces for a valid outfit", () => {
      const singleGarment = createTestGarment("1", "SHIRT", ["#ff0000"]);

      const { groups } = generateOutfitGroups([singleGarment], testPalettes);
      expect(groups).toHaveLength(0);
    });

    it("excludes socks and shoes from outfit generation", () => {
      const shirt = createTestGarment("1", "SHIRT", ["#ff0000"]);
      const sock = createTestGarment("2", "SOCKS", ["#000000"]);
      const pants = createTestGarment("3", "PANTS", ["#000000"]);

      const { groups } = generateOutfitGroups([shirt, sock, pants], testPalettes);

      // Shirt + pants should combine (both in palette 1)
      // Sock should be completely ignored
      const hasShirtAndPants = groups.some((g) => {
        const cats = g.garments.map((gar) => gar.category);
        return cats.includes("SHIRT") && cats.includes("PANTS") && !cats.includes("SOCKS");
      });
      expect(hasShirtAndPants).toBe(true);

      // No outfit should include socks as the sole bottom piece
      const outfitWithSockOnly = groups.some((g) => {
        const cats = g.garments.map((gar) => gar.category);
        return cats.includes("SOCKS") && !cats.includes("PANTS");
      });
      expect(outfitWithSockOnly).toBe(false);
    });

    it("enforces no-repeated-category rule", () => {
      const shirt1 = createTestGarment("1", "SHIRT", ["#ff0000"]);
      const shirt2 = createTestGarment("2", "SHIRT", ["#ff8800"]);
      const pants = createTestGarment("3", "PANTS", ["#000000"]);

      const { groups } = generateOutfitGroups([shirt1, shirt2, pants], testPalettes);

      // No outfit should contain both shirt1 and shirt2 (both SHIRT category)
      const hasBothShirts = groups.some((g) => {
        const ids = g.garments.map((gar) => gar.id);
        return ids.includes("1") && ids.includes("2");
      });
      expect(hasBothShirts).toBe(false);
    });

    it("enforces MIN_DISTINCT_PALETTE_COLORS requirement", () => {
      // Black shirt + black pants: both map to palette 1 (Black + Grey)
      // but the outfit uses only 1 color of the palette, so should be filtered
      const blackShirt = createTestGarment("1", "SHIRT", ["#000000"]);
      const blackPants = createTestGarment("2", "PANTS", ["#000000"]);

      const { groups } = generateOutfitGroups([blackShirt, blackPants], testPalettes);

      // The outfit should yield no palettes because both colors are #000000,
      // using only 1 distinct color slot in any palette (min is 2).
      expect(groups).toHaveLength(0);
    });

    it("accepts outfits that use at least MIN_DISTINCT_PALETTE_COLORS slots", () => {
      // Red shirt + orange pants: both match palette 2 (Red + Orange)
      const redShirt = createTestGarment("1", "SHIRT", ["#ff0000"]);
      const orangePants = createTestGarment("2", "PANTS", ["#ff8800"]);

      const { groups } = generateOutfitGroups([redShirt, orangePants], testPalettes);

      // Red + Orange should form an outfit using palette 2 (Red + Orange)
      // with 2 distinct colors (MIN_DISTINCT_PALETTE_COLORS = 2).
      expect(groups.length).toBeGreaterThan(0);

      const outfit = groups[0];
      expect(outfit.garments).toHaveLength(2);
      expect(outfit.palettes.length).toBeGreaterThan(0);
    });

    it("requires both a top and a bottom piece", () => {
      // Two shirts with no pants
      const shirt1 = createTestGarment("1", "SHIRT", ["#ff0000"]);
      const shirt2 = createTestGarment("2", "SWEATER", ["#ff8800"]);

      const { groups } = generateOutfitGroups([shirt1, shirt2], testPalettes);

      // No outfit should be valid because there is no PANTS
      expect(groups).toHaveLength(0);
    });
  });
});
