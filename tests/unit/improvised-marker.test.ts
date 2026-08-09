import { describe, it, expect } from "vitest";
import { isImprovised } from "@/lib/outfits/worn";
import type { SavedOutfit } from "@/lib/outfits/types";

function outfit(overrides: Partial<SavedOutfit>): SavedOutfit {
  return {
    id: "o1",
    name: "Outfit #1",
    improvised: false,
    paletteId: 1,
    favorite: false,
    createdAt: new Date("2026-01-01"),
    wornEvents: [],
    garments: [],
    ...overrides,
  };
}

describe("isImprovised", () => {
  it("reads the explicit flag, not the absence of a name", () => {
    // Regression: `name === null` was the original marker. Real databases
    // already held nameless *saved* outfits, so every one of them read as
    // improvised and got filtered out of /armari.
    expect(isImprovised(outfit({ name: null, improvised: false }))).toBe(false);
    expect(isImprovised(outfit({ name: "Outfit #3", improvised: true }))).toBe(true);
  });

  it("marks a builder-assembled outfit", () => {
    expect(isImprovised(outfit({ name: null, improvised: true }))).toBe(true);
  });

  it("leaves a deliberately saved outfit alone", () => {
    expect(isImprovised(outfit({}))).toBe(false);
  });
});
