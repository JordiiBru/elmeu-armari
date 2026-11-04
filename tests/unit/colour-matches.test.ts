import { describe, expect, it } from "vitest";
import { colourMatchesFor, palettesForAnchors } from "@/lib/colors/matches";
import { anchorFor } from "@/lib/outfits/engine";
import { palettes } from "@/lib/colors";

describe("colourMatchesFor", () => {
  it("pairs each garment colour with the engine's own anchor", () => {
    const [m] = colourMatchesFor(["#1f2a44"]);
    const anchor = anchorFor("#1f2a44");
    expect(m.hex).toBe("#1f2a44");
    expect(m.anchor?.hex).toBe(anchor?.canonical.hex.toLowerCase());
    expect(m.anchor?.name).toBe(anchor?.canonical.name);
  });

  it("keeps an exact Sanzo colour as its own anchor", () => {
    const hex = palettes[0].colores[0].toLowerCase();
    expect(colourMatchesFor([hex])[0].anchor?.hex).toBe(hex);
  });
});

describe("palettesForAnchors", () => {
  it("lists every palette with the anchor, smallest first then by id", () => {
    const hex = palettes[0].colores[0].toLowerCase();
    const [group] = palettesForAnchors(colourMatchesFor([hex]));
    const expected = palettes.filter((p) => p.colores.some((c) => c.toLowerCase() === hex));
    expect(group.palettes).toHaveLength(expected.length);
    for (const p of group.palettes) {
      expect(p.colors.some((c) => c.hex.toLowerCase() === hex)).toBe(true);
    }
    const keys = group.palettes.map((p) => [p.colors.length, p.id]);
    const sorted = [...keys].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    expect(keys).toEqual(sorted);
  });

  it("does not repeat a list when two colours share an anchor", () => {
    const hex = palettes[0].colores[0].toLowerCase();
    expect(palettesForAnchors(colourMatchesFor([hex, hex]))).toHaveLength(1);
  });
});
