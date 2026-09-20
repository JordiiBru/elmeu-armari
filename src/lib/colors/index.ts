import rawColors from "./sanzo-colors.json";
import rawCombinations from "./sanzo-wada.json";
import type { SanzoPalette } from "@/lib/outfits/types";

/**
 * Single source of truth for the Sanzo Wada colours.
 *
 * Two sources:
 * - sanzo-colors.json: 157 individual colours with their historic name,
 *   cmyk/rgb/hex and the list of combinations they appear in.
 * - sanzo-wada.json: 348 combinations (palettes) of 2-6 colours by hex,
 *   used by the matching engine (engine.ts).
 *
 * This module enriches the second with the first and exposes lookups. It
 * leaves the SanzoPalette structure alone and only adds the historic names
 * through a lookup function.
 */

export interface NamedColor {
  index: number;
  name: string;
  slug: string;
  hex: string;
  rgb: [number, number, number];
  cmyk: [number, number, number, number];
  combinations: number[];
  useCount: number;
}

interface RawNamedColor {
  index: number;
  name: string;
  slug: string;
  hex: string;
  rgb_array: number[];
  cmyk_array: number[];
  combinations?: number[];
  use_count: number;
}

const rawFile = rawColors as { colors: RawNamedColor[] };

export const namedColors: NamedColor[] = rawFile.colors.map((c) => ({
  index: c.index,
  name: c.name,
  slug: c.slug,
  hex: c.hex.toLowerCase(),
  rgb: c.rgb_array as [number, number, number],
  cmyk: c.cmyk_array as [number, number, number, number],
  combinations: c.combinations ?? [],
  useCount: c.use_count,
}));

const HEX_TO_NAME = new Map<string, string>(
  namedColors.map((c) => [c.hex.toLowerCase(), c.name]),
);

/** The historic name of a Sanzo Wada hex, if it has one. */
export function nameOf(hex: string): string | null {
  return HEX_TO_NAME.get(hex.toLowerCase()) ?? null;
}

/** The Sanzo Wada combinations, same shape as sanzo-wada.json. */
export const palettes = rawCombinations as SanzoPalette[];

/** The colours of a combination, each with its name. */
export function paletteColors(
  palette: SanzoPalette,
): { hex: string; name: string | null }[] {
  return palette.colores.map((hex) => ({
    hex,
    name: nameOf(hex),
  }));
}
