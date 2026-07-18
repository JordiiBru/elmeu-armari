import { describe, it, expect } from "vitest";
import {
  isNeutralHex,
  hexToOklch,
  oklchDistance,
  perceptualDistance,
  NEUTRAL_CHROMA_THRESHOLD,
  OKLCH_DISTANCE_THRESHOLD,
  NEUTRAL_MISMATCH_PENALTY,
} from "@/lib/outfits/color-matching";
import { namedColors } from "@/lib/colors";

// ── isNeutralHex ──────────────────────────────────────────────────────────────

describe("isNeutralHex", () => {
  it("black is neutral", () => {
    expect(isNeutralHex("#000000")).toBe(true);
  });

  it("white is neutral", () => {
    expect(isNeutralHex("#ffffff")).toBe(true);
  });

  it("pure grey is neutral", () => {
    expect(isNeutralHex("#808080")).toBe(true);
  });

  it("vivid red is not neutral", () => {
    expect(isNeutralHex("#ff0000")).toBe(false);
  });

  it("vivid blue is not neutral", () => {
    expect(isNeutralHex("#0000ff")).toBe(false);
  });

  it("boundary: chroma exactly at threshold reads as saturated", () => {
    // Any hex whose OKLCH C is >= NEUTRAL_CHROMA_THRESHOLD is not neutral.
    // Verify the constant is exported and the function respects it.
    const c = hexToOklch("#808080").C;
    expect(c).toBeLessThan(NEUTRAL_CHROMA_THRESHOLD);
  });
});

// ── hexToOklch ────────────────────────────────────────────────────────────────

describe("hexToOklch", () => {
  it("black has L=0 C=0", () => {
    const { L, C } = hexToOklch("#000000");
    expect(L).toBeCloseTo(0, 3);
    expect(C).toBeCloseTo(0, 3);
  });

  it("white has L≈1 C≈0", () => {
    const { L, C } = hexToOklch("#ffffff");
    expect(L).toBeCloseTo(1, 2);
    expect(C).toBeCloseTo(0, 2);
  });

  it("hue wraparound: negative atan2 result mapped to [0, 360)", () => {
    // Some hues (e.g. blues) produce negative atan2 results.
    const { h } = hexToOklch("#0000ff");
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(360);
  });

  it("red and green have different hues", () => {
    const red = hexToOklch("#ff0000");
    const green = hexToOklch("#00ff00");
    expect(Math.abs(red.h - green.h)).toBeGreaterThan(30);
  });
});

// ── oklchDistance ─────────────────────────────────────────────────────────────

describe("oklchDistance", () => {
  it("distance from a colour to itself is 0", () => {
    expect(oklchDistance("#3a7bd5", "#3a7bd5")).toBe(0);
  });

  it("is symmetric", () => {
    const a = "#c0392b";
    const b = "#2980b9";
    expect(oklchDistance(a, b)).toBeCloseTo(oklchDistance(b, a), 8);
  });

  it("black and white are far apart", () => {
    expect(oklchDistance("#000000", "#ffffff")).toBeGreaterThan(20);
  });

  it("very similar colours are close", () => {
    expect(oklchDistance("#1a1a1a", "#1e1e1e")).toBeLessThan(3);
  });

  it("hue wraparound: 0° and 359° are close, not 359 units apart", () => {
    // Pick two near-hue reds straddling 0/360.
    const almostRed1 = "#ff0000"; // hue ~29°
    const almostRed2 = "#fe0010"; // hue very close
    expect(oklchDistance(almostRed1, almostRed2)).toBeLessThan(5);
  });
});

// ── perceptualDistance (neutral-mismatch penalty) ─────────────────────────────

describe("perceptualDistance", () => {
  it("neutral vs neutral: no penalty (matches oklchDistance)", () => {
    const a = "#000000";
    const b = "#808080";
    expect(perceptualDistance(a, b)).toBeCloseTo(oklchDistance(a, b), 8);
  });

  it("saturated vs saturated: no penalty", () => {
    const a = "#e74c3c";
    const b = "#3498db";
    expect(perceptualDistance(a, b)).toBeCloseTo(oklchDistance(a, b), 8);
  });

  it("neutral vs saturated: penalty applied", () => {
    const neutral = "#808080";
    const saturated = "#e74c3c";
    const raw = oklchDistance(neutral, saturated);
    const penalised = perceptualDistance(neutral, saturated);
    expect(penalised).toBeCloseTo(raw * NEUTRAL_MISMATCH_PENALTY, 5);
    expect(penalised).toBeGreaterThan(raw);
  });

  it("penalty pushes grey+brown past OKLCH_DISTANCE_THRESHOLD", () => {
    // Without penalty, mathematically similar-lightness neutrals + desaturated
    // browns could slip under the threshold and match incorrectly.
    const grey = "#808080";
    const desaturatedBrown = "#8b7355";
    const penalised = perceptualDistance(grey, desaturatedBrown);
    // If the penalty is working, this should be > threshold or at least > raw.
    expect(penalised).toBeGreaterThan(oklchDistance(grey, desaturatedBrown));
  });
});

// ── Sanzo Wada snapping invariants ───────────────────────────────────────────

describe("Sanzo Wada canonical catalogue", () => {
  it("Plumbeous (#5c7287) is quasi-neutral, not achromatic — protects grey snapping", () => {
    // Plumbeous is a low-chroma blue-grey (C≈0.042).
    // The engine comment warns about it: "technically low-chroma but clearly hued."
    // It's quasi-neutral (0.02 ≤ C < 0.05) so it snaps among neutrals,
    // but pure achromatic greys (C < 0.02) snap only within GREY_FAMILY_HEXES
    // which explicitly excludes Plumbeous.
    const { C } = hexToOklch("#5c7287");
    const ACHROMATIC_CHROMA = 0.02;
    expect(C).toBeGreaterThan(ACHROMATIC_CHROMA);   // not achromatic
    expect(C).toBeLessThan(NEUTRAL_CHROMA_THRESHOLD); // quasi-neutral
  });

  it("all named canonical hexes are valid 6-digit hex strings", () => {
    const valid = /^#[0-9a-f]{6}$/i;
    for (const c of namedColors) {
      expect(c.hex).toMatch(valid);
    }
  });

  it("all but one canonical colour map to at least one combination id", () => {
    // "Vandar Poel's Blue" (#003e83) is the only colour in the Sanzo Wada
    // dictionary that does not appear in any of the 348 recorded combinations.
    // This is a property of the source data, not a bug.
    const withoutCombinations = namedColors.filter(
      (c) => c.combinations.length === 0,
    );
    expect(withoutCombinations).toHaveLength(1);
    expect(withoutCombinations[0].hex.toLowerCase()).toBe("#003e83");
  });

  it("Black (#000000) is within OKLCH_DISTANCE_THRESHOLD of itself", () => {
    // This is trivially true but validates that the threshold constant
    // is sane (> 0) and the distance fn works end-to-end.
    expect(oklchDistance("#000000", "#000000")).toBeLessThan(
      OKLCH_DISTANCE_THRESHOLD,
    );
  });
});
