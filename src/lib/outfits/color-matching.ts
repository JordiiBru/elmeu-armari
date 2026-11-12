/**
 * Perceptual colour matching. The engine's one distance is CIEDE2000
 * (CIELAB from sRGB, D65) with the grey handling below; OKLab/OKLCH stay
 * for chroma (greyness), the grey ramp's lightness slack and photo colour
 * extraction.
 */

/**
 * Vocabulary threshold, in the units of `perceptualDistance` (CIEDE2000
 * with the grey penalties). A colour with no canonical inside it is outside
 * the Sanzo Wada vocabulary. 15 rather than 14 for margin: the farthest
 * colour of the dev wardrobe, the khaki-brown chino `#5d5246`, sits at 13.5
 * and must stay placed (#220).
 */
export const VOCABULARY_THRESHOLD = 15;

/**
 * A garment colour is willing to live in the palettes of every canonical
 * within this distance, plus its nearest one whatever the distance. Stricter
 * than the vocabulary threshold on purpose: with the vocabulary threshold
 * as membership, "these two pieces share a palette" almost never said no.
 * 11 gives a dev-wardrobe colour about as many canonicals inside it (2.7
 * on average) as 9 did under the OKLCH metric this one replaced (2.8), so a
 * colour accepts as many readings as before; the top, bottom and shoe
 * pairs that share a palette go from 78 % to 70 % (#220).
 */
export const MEMBERSHIP_THRESHOLD = 11;

/**
 * Strict threshold for the "additional" palettes shown under the main one.
 * Every piece-to-colour assignment must meet it, so the palette visibly
 * contains the outfit's colours and not distant approximations. 10 keeps
 * the extras the dev wardrobe's outfits show about where the OKLCH metric
 * had them at 9: 2.9 per outfit against 2.7 (11 gives 3.0, 9 gives 1.9).
 */
export const TIGHT_MATCH_THRESHOLD = 10;

/** Most additional palettes shown per outfit. */
export const MAX_EXTRA_PALETTES = 4;

/**
 * Chroma (OKLab) at which a colour stops reading as grey. Greyness is
 * continuous: 1 at chroma 0, falling linearly to 0 here, so there is no
 * line to cross. Pickers and photos give tinted greys (a charcoal at
 * C 0.006, a khaki chino at 0.032), which is why the scale is this small:
 * a piece at 0.03 already has a hue people name.
 */
export const GREY_CHROMA = 0.03;

/**
 * Multiplier on the distance when one colour is grey and the other is
 * not, scaled by how different their greyness is. CIEDE2000 already keeps
 * a grey and a dark brown of the same lightness apart better than plain
 * OKLCH did, so this is milder than the 3 the OKLCH metric needed; it
 * still stops a charcoal from reading as a deep slate.
 */
const NEUTRAL_MISMATCH_PENALTY = 2;

/**
 * The same penalty towards a grey-ramp rung. Milder, because the lightness
 * slack already keeps a hued piece from riding a rung far.
 */
const RUNG_MISMATCH_PENALTY = 1.5;

/**
 * CIEDE2000 lightness weight (the standard formula's kL). Textile colour
 * work uses 2: a garment's lightness varies with fabric, light and photo
 * far more than its hue does. At 1 a mid denim goes to the much more
 * saturated Blue instead of Olympic Blue (1.1 and below still lose it); from
 * 1.3 a mauve bag drifts from its nearest colour, Lilac, to Laelia Pink.
 * 1.25 is the value between: on the dev wardrobe 33 of 36 colours anchor to
 * their nearest Sanzo colour by plain CIEDE2000 (#220).
 */
const LIGHTNESS_WEIGHT = 1.25;

/**
 * Share of a grey-ramp rung's lightness slack that survives however
 * hued the piece is. Without it a very dark tinted red (`#180808`) is
 * too far from Black for the slack to reach, and the garment drops out
 * of the vocabulary altogether.
 */
const RUNG_SLACK_FLOOR = 0.3;

/**
 * How far, in OKLab L, a piece may sit from a grey-ramp rung and still read
 * as it: `darker` for a piece darker than the rung, `lighter` for one lighter.
 * One-sided because the gaps in the ramp are: nothing grey sits between
 * Black and Plumbeous, so those two stretch towards each other and the light
 * greys, packed 0.04 apart, need no slack at all.
 */
export interface RungSlack {
  darker: number;
  lighter: number;
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/** 1 for a grey, 0 once the chroma reaches `GREY_CHROMA`. */
export function greyness(chroma: number): number {
  return clamp01(1 - chroma / GREY_CHROMA);
}

/**
 * Perceptual distance between a colour and another one, the single
 * measure the engine snaps with: CIEDE2000 (lightness weighted by
 * `LIGHTNESS_WEIGHT`) times a mismatch penalty that is continuous in
 * chroma. Symmetric, except with `rung`, where the second colour plays
 * the anchor.
 *
 * `rung` says the second colour is a rung of the grey ramp (Black, White,
 * the Sanzo greys): the first colour's OKLab lightness then moves towards
 * the rung by up to the slack on its side before CIEDE2000 is taken,
 * scaled by how grey the first one is (never below `RUNG_SLACK_FLOOR` of
 * it), and the rung counts as fully grey for the mismatch penalty. Sanzo
 * Wada has no dark grey, so without the slack a charcoal shirt has no
 * anchor at all. Slack is in OKLab L units (0.25 is 25 points).
 */
export function perceptualDistance(hex1: string, hex2: string, rung?: RungSlack): number {
  const p = hexToOklab(hex1);
  const q = hexToOklab(hex2);
  const pGrey = greyness(Math.hypot(p[1], p[2]));

  let lab1 = hexToLab(hex1);
  if (rung) {
    const side = p[0] < q[0] ? rung.darker : rung.lighter;
    const slack = side * Math.max(RUNG_SLACK_FLOOR, pGrey);
    const gap = q[0] - p[0];
    lab1 = oklabToLab(p[0] + Math.max(-slack, Math.min(slack, gap)), p[1], p[2]);
  }
  const raw = ciede2000(lab1, hexToLab(hex2), LIGHTNESS_WEIGHT);
  // A rung is a grey by definition, whatever tint the catalogue gave it,
  // so the mismatch is how hued the piece is.
  const [penalty, otherGreyness] = rung
    ? [RUNG_MISMATCH_PENALTY, 1]
    : [NEUTRAL_MISMATCH_PENALTY, greyness(Math.hypot(q[1], q[2]))];
  return raw * (1 + (penalty - 1) * Math.abs(pGrey - otherGreyness));
}

type Lab = [number, number, number];

const labCache = new Map<string, Lab>();
const oklabCache = new Map<string, [number, number, number]>();

function hexToOklab(hex: string): [number, number, number] {
  let v = oklabCache.get(hex);
  if (!v) {
    const [r, g, b] = hexToRgb(hex);
    v = rgbToOklab(r, g, b);
    oklabCache.set(hex, v);
  }
  return v;
}

/** CIELAB (D65) of a hex, through OKLab so the slack path and this agree. */
function hexToLab(hex: string): Lab {
  let v = labCache.get(hex);
  if (!v) {
    v = oklabToLab(...hexToOklab(hex));
    labCache.set(hex, v);
  }
  return v;
}

function labF(t: number): number {
  return Math.abs(t) > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
}

/** OKLab to CIELAB (D65) through linear sRGB and XYZ, without gamut clamping. */
function oklabToLab(L: number, a: number, b: number): Lab {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * bl) / 0.95047;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * bl) / 1.08883;
  const fx = labF(x);
  const fy = labF(y);
  const fz = labF(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

const deg = Math.PI / 180;

/** CIEDE2000 colour difference (Sharma et al. 2005), with a lightness weight. */
export function ciede2000([L1, a1, b1]: Lab, [L2, a2, b2]: Lab, kL = 1): number {
  const cBar = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2;
  const g = 0.5 * (1 - Math.sqrt(cBar ** 7 / (cBar ** 7 + 25 ** 7)));
  const a1p = (1 + g) * a1;
  const a2p = (1 + g) * a2;
  const c1p = Math.hypot(a1p, b1);
  const c2p = Math.hypot(a2p, b2);
  const hue = (b: number, a: number) => {
    const h = Math.atan2(b, a) / deg;
    return h < 0 ? h + 360 : h;
  };
  const h1p = hue(b1, a1p);
  const h2p = hue(b2, a2p);

  const dLp = L2 - L1;
  const dCp = c2p - c1p;
  let dhp = 0;
  if (c1p * c2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(c1p * c2p) * Math.sin((dhp / 2) * deg);

  const lBar = (L1 + L2) / 2;
  const cBarP = (c1p + c2p) / 2;
  let hBarP = h1p + h2p;
  if (c1p * c2p !== 0) {
    if (Math.abs(h1p - h2p) <= 180) hBarP = (h1p + h2p) / 2;
    else if (h1p + h2p < 360) hBarP = (h1p + h2p + 360) / 2;
    else hBarP = (h1p + h2p - 360) / 2;
  }
  const t =
    1 -
    0.17 * Math.cos((hBarP - 30) * deg) +
    0.24 * Math.cos(2 * hBarP * deg) +
    0.32 * Math.cos((3 * hBarP + 6) * deg) -
    0.2 * Math.cos((4 * hBarP - 63) * deg);
  const dTheta = 30 * Math.exp(-(((hBarP - 275) / 25) ** 2));
  const rC = 2 * Math.sqrt(cBarP ** 7 / (cBarP ** 7 + 25 ** 7));
  const sL = kL * (1 + (0.015 * (lBar - 50) ** 2) / Math.sqrt(20 + (lBar - 50) ** 2));
  const sC = 1 + 0.045 * cBarP;
  const sH = 1 + 0.015 * cBarP * t;
  const rT = -Math.sin(2 * dTheta * deg) * rC;
  const x = dLp / sL;
  const y = dCp / sC;
  const z = dHp / sH;
  return Math.sqrt(x * x + y * y + z * z + rT * y * z);
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
