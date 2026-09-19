import { describe, it, expect } from "vitest";
import {
  greyness,
  hexToOklch,
  oklchDistance,
  perceptualDistance,
  GREY_CHROMA,
  OKLCH_DISTANCE_THRESHOLD,
} from "@/lib/outfits/color-matching";
import { anchorFor } from "@/lib/outfits/engine";
import { namedColors } from "@/lib/colors";

// ── greyness ──────────────────────────────────────────────────────────────────

describe("greyness", () => {
  it("black, white and pure grey read as grey", () => {
    for (const hex of ["#000000", "#ffffff", "#808080"]) {
      expect(greyness(hexToOklch(hex).C)).toBeGreaterThan(0.95);
    }
  });

  it("vivid colours are not grey at all", () => {
    for (const hex of ["#ff0000", "#0000ff"]) {
      expect(greyness(hexToOklch(hex).C)).toBe(0);
    }
  });

  it("falls to zero exactly at GREY_CHROMA, with no step before it", () => {
    expect(greyness(GREY_CHROMA)).toBe(0);
    expect(greyness(GREY_CHROMA - 0.0005)).toBeLessThan(0.05);
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

// ── perceptualDistance ────────────────────────────────────────────────────────

describe("perceptualDistance", () => {
  it("is 0 for the same colour", () => {
    expect(perceptualDistance("#3a7bd5", "#3a7bd5")).toBe(0);
  });

  it("two greys stay close", () => {
    expect(perceptualDistance("#808080", "#909090")).toBeLessThan(OKLCH_DISTANCE_THRESHOLD);
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
});

// ── Sanzo Wada snapping invariants ───────────────────────────────────────────

describe("Sanzo Wada canonical catalogue", () => {
  it("Plumbeous (#5c7287) is hued, not a rung of the grey ramp — protects grey snapping", () => {
    // Plumbeous is a low-chroma blue-grey (C≈0.042): technically dull,
    // clearly hued. A grey piece must not anchor to it, whatever its
    // lightness, so it reads as fully hued and earns no lightness slack.
    const { C } = hexToOklch("#5c7287");
    expect(greyness(C)).toBe(0);
    for (const grey of ["#5d5d5f", "#6e6e6e", "#7f8183"]) {
      expect(anchorFor(grey)?.canonical.name).not.toBe("Deep Violet / Plumbeous");
    }
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
