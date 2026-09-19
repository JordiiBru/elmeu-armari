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

  it("never suggests a neutral, even in a palette that contains it", () => {
    // Palette 69 is Warm Gray + Black and palette 55 has White: an
    // accessory in exactly those colours is within the tight threshold of
    // the palette, so only the neutral rule keeps it out. (Against the
    // rust and teal palette this test could not fail.)
    const warmGrayBlack = palettes.find((p) => p.id === 69)!;
    expect(warmGrayBlack.colores).toContain("#000000");
    const withWhite = palettes.find((p) => p.colores.includes("#ffffff"))!;
    const neutrals = [
      "#000000",
      "#1c1c1e",
      "#9cb29e", // Warm Gray
      "#9fc2b2", // Mineral Gray
      "#a3b5a5", // a tinted grey no Sanzo entry names
      "#808080",
    ].map((hex, i) => garment(`n${i}`, "ACCESSORI", [hex]));
    const shirt = garment("s", "SHIRT", [warmGrayBlack.colores[0]]);
    expect(suggestAccessories([shirt], warmGrayBlack, neutrals)).toEqual([]);
    const white = garment("w", "ACCESSORI", ["#ffffff"]);
    expect(suggestAccessories([shirt], withWhite, [white])).toEqual([]);
  });

  it("does suggest a dull colour that only looks nearly grey (a blush pink, an olive drab)", () => {
    const blushPalette = palettes.find((p) => p.id === 45)!; // Seashell Pink + a yellow
    const blush = garment("blush", "ACCESSORI", ["#e8d5d5"]);
    expect(ids(suggestAccessories([garment("s", "SHIRT", ["#ffcfc4"])], blushPalette, [blush]))).toEqual([
      "blush",
    ]);
  });

  it("counts a palette colour as worn the way the engine assigns it", () => {
    // Palette 110 has Brown and Vandyke Brown close together. Wearing the
    // brown does not mean wearing the Vandyke Brown, so an accessory in it
    // is still the accent.
    const brownPalette = palettes.find((p) => p.id === 110)!;
    const brownOutfit = [garment("s", "SHIRT", ["#6c2b11"]), garment("p", "PANTS", ["#6c2b11"])];
    const vandyke = garment("v", "ACCESSORI", ["#362304"]);
    const result = suggestAccessories(brownOutfit, brownPalette, [vandyke]);
    expect(ids(result)).toEqual(["v"]);
    expect(result[0].accent).toBe(true);
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
    const notAnAccessory = garment("shoe", "SHOES", [RUST]);
    expect(suggestAccessories(outfit, palette, [notAnAccessory])).toEqual([]);
    expect(suggestAccessories(outfit, null, [garment("belt", "ACCESSORI", [RUST])])).toEqual([]);
  });
});
