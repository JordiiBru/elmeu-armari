/**
 * OKLCH-based perceptual color matching.
 * Converts hex → sRGB → linear RGB → OKLab → OKLCH,
 * then computes deltaE as Euclidean distance in OKLCH space.
 */

export const OKLCH_DISTANCE_THRESHOLD = 14;

/**
 * Threshold estricte per paletes "addicionals" mostrades sota la principal.
 * Cada assignacio peça-color ha de complir aquest per garantir que la paleta
 * conte visualment els colors de l'outfit, no aproximacions llunyanes.
 */
export const OKLCH_TIGHT_MATCH_THRESHOLD = 9;

/**
 * Nombre maxim de paletes addicionals mostrades per outfit.
 */
export const MAX_EXTRA_PALETTES = 4;

/**
 * Nombre maxim de colors no-neutres de la paleta que poden quedar sense
 * coberts per una peça de l'outfit. Un valor 1 tolera un "color accent
 * de la paleta que no tens al armari pero podries afegir".
 */
export const MAX_UNMATCHED_CHROMATIC = 1;

/**
 * Un color amb chroma per sota d'aixo es considera neutre (blanc/negre/gris/beige apagat).
 * En OKLCH, la distancia de hue es ponderada per la chroma mitjana:
 *   dH = 2 * avgC * sin(dHue / 2)
 * Amb un dels dos colors neutre, avgC ~ 0 i la hue no penalitza gairebe res —
 * un gris queda a distancia moderada d'un marro o oliva de la mateixa
 * lluminositat, tot i ser visualment molt diferents. Per evitar-ho, exigim
 * que els neutres matchegin nomes amb altres neutres.
 */
/**
 * Els usuaris trien colors amb un picker: rarament seleccionaran valors
 * super saturats. Un "verd" real pot acabar a chroma 0.05-0.08, un beige
 * viu a 0.04. Un llindar generos de neutralitat evita que aquests colors
 * pateixin el bug de matcher-hue-per-chroma-baixa i que un beige apagat
 * es tracti diferent d'un gris.
 */
export const NEUTRAL_CHROMA_THRESHOLD = 0.05;

/**
 * Multiplicador aplicat a la distancia quan un color es neutre i l'altre no.
 * Un gris (C~0) i un marro fosc (C~0.05) de la mateixa lluminositat tenen
 * distancia OKLCH baixa per artefacte matematic (avgC ~ 0 → dH ~ 0). Aplicar
 * aquest multiplicador els empeny per sobre del threshold general.
 */
export const NEUTRAL_MISMATCH_PENALTY = 1.6;

export function isNeutralHex(hex: string): boolean {
  return hexToOklch(hex).C < NEUTRAL_CHROMA_THRESHOLD;
}

/**
 * Distancia perceptual amb penalitzacio si un color es neutre i l'altre no.
 * Usa aixo en lloc de `oklchDistance` per matching peça-paleta.
 */
export function perceptualDistance(hex1: string, hex2: string): number {
  const raw = oklchDistance(hex1, hex2);
  return isNeutralHex(hex1) !== isNeutralHex(hex2)
    ? raw * NEUTRAL_MISMATCH_PENALTY
    : raw;
}

interface OKLCH {
  L: number;
  C: number;
  h: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

function linearize(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function rgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const lr = linearize(r);
  const lg = linearize(g);
  const lb = linearize(b);

  const l_ = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m_ = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s_ = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const bVal = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  return [L, a, bVal];
}

function oklabToOklch(L: number, a: number, b: number): OKLCH {
  const C = Math.sqrt(a * a + b * b);
  const h = (Math.atan2(b, a) * 180) / Math.PI;
  return { L, C, h: h < 0 ? h + 360 : h };
}

export function hexToOklch(hex: string): OKLCH {
  const [r, g, b] = hexToRgb(hex);
  const [L, a, bVal] = rgbToOklab(r, g, b);
  return oklabToOklch(L, a, bVal);
}

/**
 * Perceptual distance in OKLCH space.
 * Uses Euclidean distance with L scaled by 100, C scaled by 100,
 * and hue difference weighted by chroma.
 */
export function oklchDistance(hex1: string, hex2: string): number {
  const c1 = hexToOklch(hex1);
  const c2 = hexToOklch(hex2);

  const dL = (c1.L - c2.L) * 100;
  const dC = (c1.C - c2.C) * 100;

  const avgC = ((c1.C + c2.C) / 2) * 100;
  let dh = c1.h - c2.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  const dhRad = (dh * Math.PI) / 180;
  const dH = 2 * avgC * Math.sin(dhRad / 2);

  return Math.sqrt(dL * dL + dC * dC + dH * dH);
}
