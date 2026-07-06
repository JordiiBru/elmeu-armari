import type { SanzoPalette } from "./types";
import { perceptualDistance } from "./color-matching";

/**
 * Escull la paleta Sanzo Wada que millor cobreix els colors de l'outfit
 * seleccionat manualment a l'emprovador. Score = suma de la distancia
 * perceptual minima de cada color de peca a algun color de la paleta.
 * Menor score = paleta que millor conte els colors escollits.
 */
export function bestPaletteFor(outfitHexes: string[], palettes: SanzoPalette[]): SanzoPalette {
  if (palettes.length === 0) throw new Error("no palettes");
  if (outfitHexes.length === 0) return palettes[0];

  let bestPalette = palettes[0];
  let bestScore = Infinity;

  for (const palette of palettes) {
    let score = 0;
    for (const hex of outfitHexes) {
      let minDist = Infinity;
      for (const pHex of palette.colores) {
        const d = perceptualDistance(hex, pHex);
        if (d < minDist) minDist = d;
      }
      score += minDist;
    }
    if (score < bestScore) {
      bestScore = score;
      bestPalette = palette;
    }
  }
  return bestPalette;
}
