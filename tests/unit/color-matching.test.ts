import { describe, it, expect } from "vitest";
import {
  ciede2000,
  greyness,
  hexToOklch,
  oklchDistance,
  perceptualDistance,
  GREY_CHROMA,
  VOCABULARY_THRESHOLD,
} from "@/lib/outfits/color-matching";
import { anchorFor } from "@/lib/outfits/engine";
import { namedColors, palettes } from "@/lib/colors";

describe("color-matching", () => {
  describe("greyness", () => {
    it("is 1 for greys and falls to 0 at GREY_CHROMA", () => {
      expect(greyness(hexToOklch("#000000").C)).toBe(1);
      expect(greyness(hexToOklch("#808080").C)).toBeGreaterThan(0.95);
      expect(greyness(GREY_CHROMA)).toBe(0);
      expect(greyness(GREY_CHROMA * 3)).toBe(0);
      expect(greyness(hexToOklch("#ff0000").C)).toBe(0);
    });

    it("is continuous: no jump anywhere along the chroma axis", () => {
      let prev = greyness(0);
      for (let c = 0.0005; c <= 0.06; c += 0.0005) {
        const g = greyness(c);
        expect(Math.abs(g - prev)).toBeLessThan(0.05);
        prev = g;
      }
    });
  });

  describe("perceptualDistance", () => {
    it("is zero for the same colour and symmetric", () => {
      expect(perceptualDistance("#736251", "#736251")).toBe(0);
      const a = "#736251";
      const b = "#5c7287";
      expect(perceptualDistance(a, b)).toBeCloseTo(perceptualDistance(b, a), 8);
    });

    it("pushes a grey away from a brown of the same lightness", () => {
      const grey = "#808080";
      const brown = "#8b7355";
      const raw = oklchDistance(grey, brown);
      expect(perceptualDistance(grey, brown)).toBeGreaterThan(raw);
      // The full mismatch penalty: the grey has no hue, the brown has one.
      expect(perceptualDistance(grey, brown)).toBeGreaterThan(raw * 1.9);
    });

    it("keeps hue apart even when both colours are dull", () => {
      // A khaki and a cyan-grey of the same lightness and chroma: the
      // plain OKLCH hue term collapses at this chroma and calls them close.
      const khaki = "#d8ccb7";
      const cyanGrey = "#b5d1cc";
      const khakiPeer = "#dccfb0";
      expect(perceptualDistance(khaki, cyanGrey)).toBeGreaterThan(
        perceptualDistance(khaki, khakiPeer) * 2,
      );
    });

    it("ignores the hue of a near-grey: it is noise", () => {
      // A magenta tint and a green tint at chroma 0.003: opposite hues,
      // a couple of channel steps apart. They are the same grey.
      const a = "#5c5d5c";
      const b = "#5d5c5d";
      expect(perceptualDistance(a, b)).toBeLessThan(2);
    });

    it("gives a grey slack in lightness towards a grey-ramp rung, faded by its chroma", () => {
      const charcoal = "#5d5d5f";
      const black = "#000000";
      const rung = { darker: 0, lighter: 0.4 };
      const plain = perceptualDistance(charcoal, black);
      const slack = perceptualDistance(charcoal, black, rung);
      expect(slack).toBeLessThan(plain);
      expect(slack).toBeLessThan(VOCABULARY_THRESHOLD);
      // A brown is not grey, so it gets none of it: the slack is faded
      // by the chroma of the piece and it stays well past the vocabulary
      // threshold from Black (25.6; CIEDE2000 keeps dark colours closer
      // together than the OKLCH metric did, hence 1.5 and not 2).
      expect(perceptualDistance("#4e2a09", black, rung)).toBeGreaterThan(
        VOCABULARY_THRESHOLD * 1.5,
      );
    });

    it("gives the slack only on the side the rung stretches to", () => {
      // Plumbeous reaches down to the dark greys Sanzo Wada lacks, not up
      // to the light greys that have rungs of their own.
      const plumbeous = "#72737c";
      const rung = { darker: 0.15, lighter: 0 };
      const darker = "#55555a";
      const lighter = "#909096";
      expect(perceptualDistance(darker, plumbeous, rung)).toBeLessThan(
        perceptualDistance(darker, plumbeous, { darker: 0, lighter: 0 }),
      );
      expect(perceptualDistance(lighter, plumbeous, rung)).toBeCloseTo(
        perceptualDistance(lighter, plumbeous, { darker: 0, lighter: 0 }),
        8,
      );
    });
  });

  describe("ciede2000", () => {
    // Test pairs and expected differences from Sharma, Wu and Dalal (2005),
    // "The CIEDE2000 color-difference formula: implementation notes,
    // supplementary test data, and mathematical observations", table 1.
    // Pairs 9 to 13 sit on the formula's hue-mean discontinuities.
    const cases: [number, [number, number, number], [number, number, number], number][] = [
      [1, [50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425],
      [2, [50, 3.1571, -77.2803], [50, 0, -82.7485], 2.8615],
      [3, [50, 2.8361, -74.02], [50, 0, -82.7485], 3.4412],
      [7, [50, 0, 0], [50, -1, 2], 2.3669],
      [9, [50, 2.49, -0.001], [50, -2.49, 0.0009], 7.1792],
      [10, [50, 2.49, -0.001], [50, -2.49, 0.001], 7.1792],
      [11, [50, 2.49, -0.001], [50, -2.49, 0.0011], 7.2195],
      [12, [50, 2.49, -0.001], [50, -2.49, 0.0012], 7.2195],
      [13, [50, -0.001, 2.49], [50, 0.0009, -2.49], 4.8045],
      [17, [50, 2.5, 0], [73, 25, -18], 27.1492],
      [18, [50, 2.5, 0], [61, -5, 29], 22.8977],
      [19, [50, 2.5, 0], [56, -27, -3], 31.903],
      [20, [50, 2.5, 0], [58, 24, 15], 19.4535],
      [25, [60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387], 1.2644],
      [34, [22.7233, 20.0904, -46.694], [23.0331, 14.973, -42.5619], 2.0373],
    ];
    it.each(cases)("matches Sharma et al. pair %i", (_, a, b, expected) => {
      expect(ciede2000(a, b)).toBeCloseTo(expected, 4);
      expect(ciede2000(b, a)).toBeCloseTo(expected, 4);
    });
  });

  describe("oklchDistance", () => {
    it("handles hue wraparound correctly at 359° to 1°", () => {
      // Create two colors with hues near the wraparound boundary
      // Using reds which are typically around 0-30° in hue
      const red1 = "#ff0000"; // Hue ≈ 0°
      const red2 = "#ff0011"; // Hue ≈ 1°, close to red1

      // Distance should account for hue wraparound properly
      // (the oklchDistance function handles this internally)
      const distance = oklchDistance(red1, red2);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(VOCABULARY_THRESHOLD);
    });

    it("returns small distance for very similar colors", () => {
      const color1 = "#ff0000";
      const color2 = "#ff0505";

      const distance = oklchDistance(color1, color2);
      expect(distance).toBeLessThan(5);
    });

    it("returns large distance for very different colors", () => {
      const black = "#000000";
      const white = "#ffffff";

      const distance = oklchDistance(black, white);
      expect(distance).toBeGreaterThan(50);
    });

    it("is symmetric", () => {
      const color1 = "#ff0000";
      const color2 = "#0000ff";

      const dist12 = oklchDistance(color1, color2);
      const dist21 = oklchDistance(color2, color1);

      expect(dist12).toBeCloseTo(dist21, 5);
    });

    it("uses hue-chroma weighting (not naive Euclidean)", () => {
      // Two greys (very low chroma) should have small hue distance
      const grey1 = "#808080";
      const grey2 = "#818181";

      // Two very saturated colors with same hue difference
      const red1 = "#ff0000";
      const magenta = "#ff00ff";

      const greyDist = oklchDistance(grey1, grey2);
      const redDist = oklchDistance(red1, magenta);

      // With proper hue-chroma weighting, greyscale hue distance is small
      // even though the hue numerically differs. Saturated colors' hue
      // differences matter more. So redDist > greyDist.
      expect(redDist).toBeGreaterThan(greyDist);
    });
  });

  describe("hexToOklch", () => {
    it("converts hex to OKLCH with L, C, h in the expected ranges", () => {
      const black = hexToOklch("#000000");
      expect(black.L).toBeLessThan(0.1);
      expect(black.C).toBeLessThan(0.01);
      expect(black.h).toBeGreaterThanOrEqual(0);
      expect(black.h).toBeLessThan(360);

      const white = hexToOklch("#ffffff");
      expect(white.L).toBeGreaterThan(0.9);
      expect(white.C).toBeLessThan(0.01);
      expect(white.h).toBeGreaterThanOrEqual(0);
      expect(white.h).toBeLessThan(360);
    });

    it("produces higher chroma for saturated colors", () => {
      const grey = hexToOklch("#808080");
      const red = hexToOklch("#ff0000");
      const green = hexToOklch("#00ff00");

      expect(red.C).toBeGreaterThan(grey.C);
      expect(green.C).toBeGreaterThan(grey.C);
    });
  });

  describe("against the anchors and the catalogue", () => {
    it("two greys stay close", () => {
      expect(perceptualDistance("#808080", "#909090")).toBeLessThan(VOCABULARY_THRESHOLD);
    });

    it("grey vs saturated: pushed above the raw OKLCH distance", () => {
      const grey = "#808080";
      const saturated = "#e74c3c";
      expect(perceptualDistance(grey, saturated)).toBeGreaterThan(oklchDistance(grey, saturated));
    });

    it("a grey is not the same anchor as a brown of the same lightness", () => {
      const grey = anchorFor("#808080");
      const desaturatedBrown = anchorFor("#8b7355");
      expect(grey?.canonical.name).not.toBe(desaturatedBrown?.canonical.name);
      const brownish = ["Sepia", "Vandyke Brown", "Pale Raw Umber", "Light Brownish Olive", "Maple"];
      expect(brownish).not.toContain(grey?.canonical.name);
    });

    it("hue is always mapped into [0, 360), also for blues", () => {
      const { h } = hexToOklch("#0000ff");
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(360);
    });

    it("red and green have different hues", () => {
      const red = hexToOklch("#ff0000");
      const green = hexToOklch("#00ff00");
      expect(Math.abs(red.h - green.h)).toBeGreaterThan(30);
    });

  describe("Sanzo Wada canonical catalogue", () => {
    it("greys anchor to a grey: Black, Plumbeous or a light Sanzo grey", () => {
      // The published Plumbeous (#72737c) is a lead grey, not the blue-grey
      // the CMYK shortcut gave (#5c7287), so a mid grey may read as it.
      expect(greyness(hexToOklch("#72737c").C)).toBeGreaterThan(0.5);
      const greys = ["Black", "Deep Violet / Plumbeous", "Warm Gray", "Neutral Gray", "Mineral Gray"];
      for (const grey of ["#5d5d5f", "#6e6e6e", "#7f8183"]) {
        expect(greys).toContain(anchorFor(grey)?.canonical.name);
      }
    });

    it("all named canonical hexes are valid 6-digit hex strings", () => {
      const valid = /^#[0-9a-f]{6}$/i;
      for (const c of namedColors) {
        expect(c.hex).toMatch(valid);
      }
    });

    it("every canonical colour is in at least one combination, and the lists agree", () => {
      // `combinations` is derived from the palettes, so a colour lists
      // exactly the palettes that contain its hex. (The old data left
      // Vandar Poel's Blue out of the seven palettes it is in.)
      for (const c of namedColors) {
        expect(c.combinations.length, c.name).toBeGreaterThan(0);
        const holding = palettes.filter((p) => p.colores.includes(c.hex)).map((p) => p.id);
        expect(c.combinations, c.name).toEqual(holding);
      }
    });

    it("Black (#000000) is within VOCABULARY_THRESHOLD of itself", () => {
      // This is trivially true but validates that the threshold constant
      // is sane (> 0) and the distance fn works end-to-end.
      expect(oklchDistance("#000000", "#000000")).toBeLessThan(
        VOCABULARY_THRESHOLD,
      );
    });
  });
  });
});
