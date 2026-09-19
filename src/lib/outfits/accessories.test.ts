import { describe, it, expect } from "vitest";
import { suggestAccessories } from "./accessories";
import { palettes } from "@/lib/colors";
import type { Category, GarmentWithColors } from "@/lib/prendas/types";

// Combination 1 is rust + teal. An outfit that wears only the rust leaves
// the teal as its natural accent.
const RUST = "#de4500";
const TEAL = "#29bdad";
const palette = palettes.find((p) => p.id === 1)!;

function garment(id: string, category: Category, hexes: string[]): GarmentWithColors {
  return {
    id,
    category,
    texture: null,
    pattern: null,
    size: null,
    subtype: null,
    length: null,
    fit: null,
    notes: null,
    image: null,
    dirtySince: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    colors: hexes.map((hex, i) => ({ id: `${id}-${i}`, hex })),
    seasons: [],
  };
}

const outfit = [
  garment("shirt", "SHIRT", [RUST]),
  garment("pants", "PANTS", [RUST]),
  garment("shoes", "SHOES", [RUST]),
];

const ids = (list: { garment: GarmentWithColors }[]) => list.map((s) => s.garment.id);

describe("suggestAccessories", () => {
  it("suggests an accessory whose colour is in the palette", () => {
    const belt = garment("belt", "ACCESSORI", [RUST]);
    expect(ids(suggestAccessories(outfit, palette, [belt]))).toEqual(["belt"]);
  });

  it("never suggests a neutral, whatever it is", () => {
    const neutrals = ["#000000", "#ffffff", "#808080", "#d6d6d6", "#1c1c1e"].map((hex, i) =>
      garment(`n${i}`, "ACCESSORI", [hex]),
    );
    expect(suggestAccessories(outfit, palette, neutrals)).toEqual([]);
  });

  it("ignores an accessory with no colour", () => {
    expect(suggestAccessories(outfit, palette, [garment("plain", "ACCESSORI", [])])).toEqual([]);
  });

  it("does not suggest a colour the palette does not have", () => {
    const purple = garment("purple", "ACCESSORI", ["#4733ff"]);
    expect(suggestAccessories(outfit, palette, [purple])).toEqual([]);
  });

  it("scores the coloured part and ignores a neutral one (a rust bag with a black strap)", () => {
    const bag = garment("bag", "ACCESSORI", [RUST, "#000000"]);
    expect(ids(suggestAccessories(outfit, palette, [bag]))).toEqual(["bag"]);
  });

  it("needs every coloured part to match (rust with a purple trim does not)", () => {
    const bag = garment("bag", "ACCESSORI", [RUST, "#4733ff"]);
    expect(suggestAccessories(outfit, palette, [bag])).toEqual([]);
  });

  it("puts the accent the outfit does not wear first", () => {
    const rust = garment("rust", "ACCESSORI", [RUST]);
    const teal = garment("teal", "ACCESSORI", [TEAL]);
    const result = suggestAccessories(outfit, palette, [rust, teal]);
    expect(ids(result)).toEqual(["teal", "rust"]);
    expect(result[0].accent).toBe(true);
    expect(result[1].accent).toBe(false);
  });

  it("shows every match, not a top few", () => {
    const many = Array.from({ length: 7 }, (_, i) => garment(`a${i}`, "ACCESSORI", [i % 2 ? RUST : TEAL]));
    expect(suggestAccessories(outfit, palette, many)).toHaveLength(7);
  });

  it("only considers accessories, and nothing without a palette", () => {
    const sock = garment("sock", "SOCKS", [RUST]);
    expect(suggestAccessories(outfit, palette, [sock])).toEqual([]);
    expect(suggestAccessories(outfit, null, [garment("belt", "ACCESSORI", [RUST])])).toEqual([]);
  });
});
