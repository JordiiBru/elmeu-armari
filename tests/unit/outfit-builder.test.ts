import { describe, it, expect } from "vitest";
import { generateOutfitGroupsForGarment, matchPieces, paletteSetFor } from "@/lib/outfits/engine";
import {
  EMPTY_PICKS,
  alivePalettes,
  buildState,
  completingAccessories,
  nextSlot,
  picksFromOutfit,
  savedContaining,
  scoreOptions,
  slotOf,
  togglePick,
  type Picks,
} from "@/lib/outfits/builder";
import { palettes } from "@/lib/colors";
import { VOCABULARY_THRESHOLD } from "@/lib/outfits/color-matching";
import type { Category, GarmentWithColors } from "@/lib/prendas/types";
import type { SavedOutfit } from "@/lib/outfits/types";

// Real Sanzo Wada hexes (see engine.test.ts): combination 122 is crimson
// + amber + green, so a shirt, trousers and shoes can each take one.
const CRIMSON = "#cd002d";
const AMBER = "#fac55f";
const GREEN = "#009087";
const RUST = "#d86310";
const BLACK = "#000000";

function g(id: string, category: Category, hexes: string[]): GarmentWithColors {
  return {
    id,
    category,
    texture: "COTTON",
    pattern: "PLAIN",
    fit: null,
    subtype: null,
    size: null,
    length: null,
    cropped: false,
    notes: null,
    image: null,
    dirtySince: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    colors: hexes.map((hex, i) => ({ id: `${id}-c${i}`, hex })),
    seasons: [],
  };
}

const shirt = g("shirt", "SHIRT", [CRIMSON]);
const sweater = g("sweater", "SWEATER", [RUST]);
const pants = g("pants", "PANTS", [AMBER]);
const shoes = g("shoes", "SHOES", [BLACK]);
const greenBag = g("bag", "ACCESSORI", [GREEN]);
const ring = g("ring", "ACCESSORI", []);

describe("engine helpers for the builder", () => {
  it("reads an accessory's palettes, which the generator never does", () => {
    const set = paletteSetFor(greenBag);
    expect(set).toBeInstanceOf(Set);
    expect((set as Set<number>).size).toBeGreaterThan(0);
  });

  it("treats black as a wildcard and a colourless piece as unmatched", () => {
    expect(paletteSetFor(shoes)).toBe("any");
    expect(paletteSetFor(ring)).toBeNull();
  });

  it("scores hand-picked pieces exactly as the generator scores the same group", () => {
    const { groups } = generateOutfitGroupsForGarment(shirt, [shirt, pants, shoes], palettes, 60);
    const generated = groups.find((x) => x.garments.length === 3);
    expect(generated).toBeDefined();
    const matched = matchPieces([shirt, pants, shoes], palettes);
    expect(matched.map((m) => m.palette.id)).toEqual(generated!.palettes.map((m) => m.palette.id));
    expect(matched[0].totalDistance).toBeCloseTo(generated!.palettes[0].totalDistance);
  });

  it("lets a colourless accessory ride along without changing the palette", () => {
    const without = matchPieces([shirt, pants, shoes], palettes);
    const withRing = matchPieces([shirt, pants, shoes, ring], palettes);
    expect(withRing.map((m) => m.palette.id)).toEqual(without.map((m) => m.palette.id));
  });
});

describe("builder slots and picks", () => {
  it("puts a sweater and a shirt in the same top slot, and leaves coats out", () => {
    expect(slotOf("SHIRT")).toBe("TOP");
    expect(slotOf("SWEATER")).toBe("TOP");
    expect(slotOf("OUTERWEAR")).toBeNull();
  });

  it("swaps the top rather than layering it, and empties it on a second tap", () => {
    let picks = togglePick(EMPTY_PICKS, shirt);
    picks = togglePick(picks, sweater);
    expect(picks.TOP?.id).toBe("sweater");
    picks = togglePick(picks, sweater);
    expect(picks.TOP).toBeUndefined();
  });

  it("adds accessories one by one and removes them on a second tap", () => {
    let picks = togglePick(EMPTY_PICKS, greenBag);
    picks = togglePick(picks, ring);
    expect(picks.ACCESSORIES.map((a) => a.id)).toEqual(["bag", "ring"]);
    picks = togglePick(picks, greenBag);
    expect(picks.ACCESSORIES.map((a) => a.id)).toEqual(["ring"]);
  });

  it("moves to the next empty required slot, then to accessories", () => {
    expect(nextSlot({ ACCESSORIES: [], TOP: shirt })).toBe("PANTS");
    expect(nextSlot({ ACCESSORIES: [], TOP: shirt, PANTS: pants, SHOES: shoes })).toBe("ACCESSORIES");
  });
});

describe("builder palettes", () => {
  it("leaves every palette open while only wildcards are picked", () => {
    expect(alivePalettes([shoes, ring])).toBeNull();
  });

  it("names what is missing and only matches once two coloured pieces share a palette", () => {
    const one = buildState({ ACCESSORIES: [], TOP: shirt }, palettes);
    expect(one.missing).toEqual(["PANTS", "SHOES"]);
    expect(one.matches).toEqual([]);
    const full = buildState({ ACCESSORIES: [], TOP: shirt, PANTS: pants, SHOES: shoes }, palettes);
    expect(full.missing).toEqual([]);
    expect(full.matches.length).toBeGreaterThan(0);
  });

  it("judges a top against the other slots, not against the top already picked", () => {
    const picks: Picks = { ACCESSORIES: [], TOP: shirt, PANTS: pants };
    const scored = scoreOptions([shirt, sweater], picks, "TOP", palettes.length);
    const own = scored.find((s) => s.garment.id === "shirt")!;
    expect(own.fits).toBe(true);
    // Its count is the palettes the trousers leave it, not shirt ∩ shirt.
    const loose = (x: GarmentWithColors) => paletteSetFor(x, VOCABULARY_THRESHOLD) as Set<number>;
    const expected = [...loose(shirt)].filter((id) => loose(pants).has(id)).length;
    expect(own.palettes).toBe(expected);
  });

  it("still offers a piece that closes every palette, last", () => {
    // Crimson and amber together leave no palette with Vandyke Brown in it,
    // even at the loose threshold the builder counts with. (A grey shoe
    // would not do here: it is a wildcard and fits any palette.)
    const picks: Picks = { ACCESSORIES: [], TOP: shirt, PANTS: pants };
    const brown = g("brown-shoes", "SHOES", ["#513412"]);
    const amberShoes = g("amber-shoes", "SHOES", [AMBER]);
    const scored = scoreOptions([brown, amberShoes], picks, "SHOES", palettes.length);
    expect(scored.map((s) => [s.garment.id, s.fits])).toEqual([
      ["amber-shoes", true],
      ["brown-shoes", false],
    ]);
  });

  it("marks the accessory that brings a missing palette colour in", () => {
    const picks: Picks = { ACCESSORIES: [], TOP: shirt, PANTS: pants, SHOES: shoes };
    const state = buildState(picks, palettes);
    // Combination 122 (crimson, amber, green) leads, its green unworn.
    const withGreen = state.matches.find((m) => m.palette.id === 122);
    expect(withGreen).toBeDefined();
    const completing = completingAccessories(picks, withGreen, [greenBag, ring], palettes);
    expect(completing.has("bag")).toBe(true);
    expect(completing.has("ring")).toBe(false);
  });
});

describe("builder and saved outfits", () => {
  const saved = (id: string, garments: GarmentWithColors[], accessories: GarmentWithColors[] = []): SavedOutfit => ({
    id,
    name: id,
    paletteId: 122,
    favorite: true,
    createdAt: new Date(0),
    garments,
    accessories,
    wornEvents: [],
  });

  it("narrows the collection to outfits wearing every picked piece, accessories included", () => {
    const a = saved("a", [shirt, pants, shoes], [greenBag]);
    const b = saved("b", [shirt, pants, shoes]);
    const c = saved("c", [sweater, pants, shoes]);
    expect(savedContaining([a, b, c], EMPTY_PICKS).map((o) => o.id)).toEqual(["a", "b", "c"]);
    expect(savedContaining([a, b, c], { ACCESSORIES: [], TOP: shirt }).map((o) => o.id)).toEqual(["a", "b"]);
    expect(savedContaining([a, b, c], { ACCESSORIES: [greenBag] }).map((o) => o.id)).toEqual(["a"]);
  });

  it("rebuilds the picks from a saved outfit, keeping the sweater of a layered one", () => {
    const layered = saved("l", [shirt, sweater, pants, shoes], [greenBag]);
    const picks = picksFromOutfit(layered);
    expect(picks.TOP?.id).toBe("sweater");
    expect(picks.PANTS?.id).toBe("pants");
    expect(picks.ACCESSORIES.map((a) => a.id)).toEqual(["bag"]);
  });
});
