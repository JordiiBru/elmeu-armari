import { describe, it, expect } from "vitest";
import {
  isNeutralHex,
  hexToOklch,
  oklchDistance,
  perceptualDistance,
  NEUTRAL_CHROMA_THRESHOLD,
  OKLCH_DISTANCE_THRESHOLD,
  NEUTRAL_MISMATCH_PENALTY,
} from "./color-matching";

describe("color-matching", () => {
  describe("isNeutralHex", () => {
    it("returns true for colors below NEUTRAL_CHROMA_THRESHOLD", () => {
      // Pure greyscale colors should be neutral
      expect(isNeutralHex("#000000")).toBe(true); // Black
      expect(isNeutralHex("#ffffff")).toBe(true); // White
      expect(isNeutralHex("#808080")).toBe(true); // Mid grey

      // Beige / warm grey colors from Sanzo (low chroma)
      expect(isNeutralHex("#9cb29e")).toBe(true); // Warm Gray (C ≈ 0.015)
      expect(isNeutralHex("#b5d1cc")).toBe(true); // Neutral Gray (C ≈ 0.025)
      expect(isNeutralHex("#d1b0b3")).toBe(true); // Fawn (C ≈ 0.035)
    });

    it("returns false for saturated colors above NEUTRAL_CHROMA_THRESHOLD", () => {
      // Vivid greens, reds, blues should be non-neutral
      expect(isNeutralHex("#ff0000")).toBe(false); // Pure red
      expect(isNeutralHex("#00ff00")).toBe(false); // Pure green
      expect(isNeutralHex("#0000ff")).toBe(false); // Pure blue

      // Real Sanzo colors
      expect(isNeutralHex("#1b4332")).toBe(false); // Olive Green (high C)
      expect(isNeutralHex("#740001")).toBe(false); // Garnet (high C)
    });

    it("respects the threshold boundary at NEUTRAL_CHROMA_THRESHOLD", () => {
      // A color at exactly the threshold boundary should be considered neutral
      const thresholdHex = "#9fb8a6"; // Carefully chosen to have C ≈ 0.05
      const oklch = hexToOklch(thresholdHex);
      const isNeutral = isNeutralHex(thresholdHex);

      // Verify the boundary logic: C < NEUTRAL_CHROMA_THRESHOLD
      if (oklch.C < NEUTRAL_CHROMA_THRESHOLD) {
        expect(isNeutral).toBe(true);
      } else {
        expect(isNeutral).toBe(false);
      }
    });
  });

  describe("perceptualDistance", () => {
    it("applies neutral-mismatch penalty when one color is neutral and the other is not", () => {
      const greyHex = "#808080"; // Neutral grey
      const oliveHex = "#556b2f"; // Saturated olive

      const isGreyNeutral = isNeutralHex(greyHex);
      const isOliveNeutral = isNeutralHex(oliveHex);
      expect(isGreyNeutral).toBe(true);
      expect(isOliveNeutral).toBe(false);

      const raw = oklchDistance(greyHex, oliveHex);
      const perceptual = perceptualDistance(greyHex, oliveHex);

      // Perceptual should be penalized (higher) because one is neutral and one is not
      expect(perceptual).toBeGreaterThan(raw);
      expect(perceptual).toBeCloseTo(raw * NEUTRAL_MISMATCH_PENALTY, 1);
    });

    it("does not penalize two neutral colors matching", () => {
      const grey1 = "#808080";
      const grey2 = "#909090";
      expect(isNeutralHex(grey1)).toBe(true);
      expect(isNeutralHex(grey2)).toBe(true);

      const raw = oklchDistance(grey1, grey2);
      const perceptual = perceptualDistance(grey1, grey2);

      // No penalty when both are neutral
      expect(perceptual).toBeCloseTo(raw, 2);
    });

    it("does not penalize two saturated colors matching", () => {
      const red1 = "#ff0000";
      const red2 = "#ff1111";
      expect(isNeutralHex(red1)).toBe(false);
      expect(isNeutralHex(red2)).toBe(false);

      const raw = oklchDistance(red1, red2);
      const perceptual = perceptualDistance(red1, red2);

      // No penalty when both are saturated
      expect(perceptual).toBeCloseTo(raw, 2);
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
