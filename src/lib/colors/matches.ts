import { anchorFor } from "@/lib/outfits/engine";
import { palettes, paletteColors } from "./index";

export interface PaletteView {
  id: number;
  colors: { hex: string; name: string | null }[];
}

export interface ColourMatch {
  /** The garment's own colour, as stored. */
  hex: string;
  /**
   * The Sanzo Wada colour the engine reads it as (`anchorFor`), or `null`
   * when it is outside the vocabulary. This is the colour outfits are
   * built from, so it is the one the palettes are listed for.
   */
  anchor: { hex: string; name: string } | null;
}

export interface AnchorPalettes {
  anchor: { hex: string; name: string };
  /** Every palette containing the anchor, smallest first, then by id. */
  palettes: PaletteView[];
}

/** Each garment colour beside the Sanzo Wada colour it snaps to. */
export function colourMatchesFor(hexes: string[]): ColourMatch[] {
  return hexes.map((hex) => {
    const best = anchorFor(hex);
    return {
      hex,
      anchor: best ? { hex: best.canonical.hex.toLowerCase(), name: best.canonical.name } : null,
    };
  });
}

/**
 * The palettes of each distinct anchor. Two garment colours that snap to
 * the same Sanzo colour share one list instead of repeating it.
 */
export function palettesForAnchors(matches: ColourMatch[]): AnchorPalettes[] {
  const seen = new Set<string>();
  const out: AnchorPalettes[] = [];
  for (const m of matches) {
    if (!m.anchor || seen.has(m.anchor.hex)) continue;
    seen.add(m.anchor.hex);
    const hex = m.anchor.hex;
    const list = palettes
      .filter((p) => p.colores.some((c) => c.toLowerCase() === hex))
      .sort((a, b) => a.colores.length - b.colores.length || a.id - b.id)
      .map((p) => ({ id: p.id, colors: paletteColors(p) }));
    out.push({ anchor: m.anchor, palettes: list });
  }
  return out;
}
