/**
 * OKLCH-based perceptual color matching.
 * Converts hex → sRGB → linear RGB → OKLab → OKLCH,
 * then computes deltaE as Euclidean distance in OKLCH space.
 */

export const OKLCH_DISTANCE_THRESHOLD = 14;

/**
 * A garment colour is willing to live in the palettes of every canonical
 * within this distance, plus its nearest one whatever the distance. Stricter
 * than the vocabulary threshold above on purpose: at 14 (about 7 just
 * noticeable differences) the median canonical has 15 others inside it, so
 * "these two pieces share a palette" almost never said no. 9 is the tight
 * match already used for a palette's extra options; on the dev wardrobe it
 * takes the share of top, bottom and shoe pairs that share a palette from
 * 79 % to 52 %, and the outfits it can build from 1,446 to 352 (see the
 * PR that introduced it for the whole sweep).
 */
export const MEMBERSHIP_THRESHOLD = 9;

/**
 * Strict threshold for the "additional" palettes shown under the main one.
 * Every piece-to-colour assignment must meet it, so the palette visibly
 * contains the outfit's colours and not distant approximations.
 */
export const OKLCH_TIGHT_MATCH_THRESHOLD = 9;

/** Most additional palettes shown per outfit. */
export const MAX_EXTRA_PALETTES = 4;

/**
 * Chroma at which a colour stops reading as grey. Greyness is continuous:
 * 1 at chroma 0, falling linearly to 0 here, so there is no line to
 * cross. Pickers and photos give tinted greys (a charcoal at C 0.006, a
 * khaki chino at 0.032), which is why the scale is this small: a piece
 * at 0.03 already has a hue people name.
 */
export const GREY_CHROMA = 0.03;

/**
 * Multiplier on the distance when one colour is grey and the other is
 * not, scaled by how different their greyness is. A grey (C~0) and a
 * dark brown (C~0.05) of the same lightness are close in OKLCH because
 * the hue term collapses near neutrals; this pushes them apart, and
 * does it gradually instead of at a chroma line.
 */
const NEUTRAL_MISMATCH_PENALTY = 3;

/**
 * The same penalty towards a grey-ramp rung. Milder, because the lightness
 * slack already keeps a hued piece from riding a rung far.
 */
const RUNG_MISMATCH_PENALTY = 2;

/**
 * Hue differences between two dull colours are tiny in OKLCH (the hue
 * term is weighted by chroma), yet a beige and a cyan-grey look nothing
 * alike. The chroma that weights the hue term never drops below this
 * floor, and the term is scaled up a little (`HUE_WEIGHT`) because a
 * wrong hue reads louder than a lightness or chroma error of equal size.
 */
const HUE_CHROMA_FLOOR = 0.06;
const HUE_WEIGHT = 1.5;

/**
 * The hue of a nearly grey colour is noise (one step in a channel swings
 * it by tens of degrees), so the hue term fades in with the chroma of
 * the *duller* colour and is fully on from here.
 */
const HUE_CONFIDENCE_CHROMA = 0.02;

/**
 * Share of a grey-ramp rung's lightness slack that survives however
 * hued the piece is. Without it a very dark tinted red (`#180808`) is
 * too far from Black for the slack to reach, and the garment drops out
 * of the vocabulary altogether.
 */
const RUNG_SLACK_FLOOR = 0.3;

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/** 1 for a grey, 0 once the chroma reaches `GREY_CHROMA`. */
export function greyness(chroma: number): number {
  return clamp01(1 - chroma / GREY_CHROMA);
}

/**
 * Perceptual distance between a colour and another one, the single
 * measure the engine snaps with: OKLab lightness and chroma, a hue term
 * with a chroma floor that fades out near grey, and a mismatch penalty
 * that is continuous in chroma. Symmetric, except with `rungSlack`,
 * where the second colour plays the anchor.
 *
 * `rungSlack` says the second colour is a rung of the grey ramp (Black,
 * White, the Sanzo greys): the first colour may then differ from it in
 * lightness by up to that much for free, scaled by how grey the first
 * one is (never below `RUNG_SLACK_FLOOR` of it), and the rung counts as
 * fully grey for the mismatch penalty. Sanzo Wada
 * has no dark or mid grey, so without the slack a charcoal shirt has no
 * anchor at all. Slack is in OKLab L units (0.4 is 40 points).
 */
export function perceptualDistance(hex1: string, hex2: string, rungSlack?: number): number {
  const c1 = hexToOklch(hex1);
  const c2 = hexToOklch(hex2);

  const slack =
    rungSlack === undefined ? 0 : rungSlack * Math.max(RUNG_SLACK_FLOOR, greyness(c1.C));
  const dL = Math.max(0, Math.abs(c1.L - c2.L) - slack) * 100;
  const dC = (c1.C - c2.C) * 100;

  let dh = c1.h - c2.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  const avgC = (c1.C + c2.C) / 2;
  const confidence = clamp01(Math.min(c1.C, c2.C) / HUE_CONFIDENCE_CHROMA);
  const dH =
    HUE_WEIGHT *
    2 *
    Math.max(avgC, HUE_CHROMA_FLOOR) *
    100 *
    Math.sin((dh * Math.PI) / 360) *
    confidence;

  const raw = Math.sqrt(dL * dL + dC * dC + dH * dH);
  // A rung is a grey by definition, whatever tint the catalogue gave it,
  // so the mismatch is how hued the piece is.
  const [penalty, otherGreyness] =
    rungSlack === undefined
      ? [NEUTRAL_MISMATCH_PENALTY, greyness(c2.C)]
      : [RUNG_MISMATCH_PENALTY, 1];
  return raw * (1 + (penalty - 1) * Math.abs(greyness(c1.C) - otherGreyness));
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

export function rgbToOklab(r: number, g: number, b: number): [number, number, number] {
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

function delinearize(c: number): number {
  const v = Math.min(1, Math.max(0, c));
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

/** OKLab back to a `#rrggbb` string, clamped to the sRGB gamut. */
export function oklabToHex(L: number, a: number, b: number): string {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return `#${rgb
    .map((c) =>
      Math.round(delinearize(c) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
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
