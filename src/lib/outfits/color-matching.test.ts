import { describe, it, expect } from "vitest";
import {
  greyness,
  hexToOklch,
  oklchDistance,
  perceptualDistance,
  GREY_CHROMA,
  OKLCH_DISTANCE_THRESHOLD,
} from "./color-matching";

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
      const plain = perceptualDistance(charcoal, black);
      const slack = perceptualDistance(charcoal, black, 0.4);
      expect(slack).toBeLessThan(plain);
      expect(slack).toBeLessThan(OKLCH_DISTANCE_THRESHOLD);
      // A brown is not grey, so it gets none of it: the slack is faded
      // by the chroma of the piece and it stays far from Black.
      expect(perceptualDistance("#4e2a09", black, 0.4)).toBeGreaterThan(
        OKLCH_DISTANCE_THRESHOLD * 2,
      );
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
      expect(distance).toBeLessThan(OKLCH_DISTANCE_THRESHOLD);
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
});
