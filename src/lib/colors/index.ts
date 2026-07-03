import rawColors from "./sanzo-colors.json";
import rawCombinations from "./sanzo-wada.json";
import type { SanzoPalette } from "@/lib/outfits/types";

/**
 * Font unica de veritat per als colors de Sanzo Wada.
 *
 * Dues fonts:
 * - sanzo-colors.json (nou): 157 colors individuals amb nom historic,
 *   cmyk/rgb/hex i llista de combinacions on apareix.
 * - sanzo-wada.json (previ): 348 combinacions (paletes) de 2-6 colors
 *   per hex. Usat pel motor de matching (engine.ts).
 *
 * Aquest modul enriqueix la primera amb la segona i exposa utilitats.
 * No trenca l'estructura SanzoPalette existent — nomes hi afegeix noms
 * historics via una funcio de lookup.
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

/** Retorna el nom historic d'un hex de Sanzo Wada, si es coneix. */
export function nameOf(hex: string): string | null {
  return HEX_TO_NAME.get(hex.toLowerCase()) ?? null;
}

/** Combinacions Sanzo Wada, mateixa forma que sanzo-wada.json. */
export const palettes = rawCombinations as SanzoPalette[];

/** Per una combinacio, retorna els seus colors enriquits amb nom. */
export function paletteColors(
  palette: SanzoPalette,
): { hex: string; name: string | null }[] {
  return palette.colores.map((hex) => ({
    hex,
    name: nameOf(hex),
  }));
}
