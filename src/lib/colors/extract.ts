import { hexToOklch, oklabToHex, rgbToOklab } from "@/lib/outfits/color-matching";

/**
 * Dominant colours of a photo, for prefilling a garment's colours.
 *
 * Pure: it takes decoded RGBA pixels (a canvas `getImageData`, or a
 * synthetic array in a test) and knows nothing about the DOM. The file
 * that gets uploaded is never touched by this; it only looks.
 *
 * 1. Drop the background: the transparent part of a cut-out, or else the
 *    regions connected to the border in the border's dominant colours.
 * 2. k-means in OKLab, so distances mean what the engine's do.
 * 3. Ordered by area, tiny and near-duplicate clusters folded away.
 * 4. Near-black and near-white snapped to the exact hex, because the
 *    engine's safe-shoe rule compares the exact string.
 */

const MAX_COLOURS = 3;

/** A background pixel is at most this far (OKLab x100) from the colour
 * of the border: wide enough for a studio vignette or a soft shadow. */
const BACKGROUND_DISTANCE = 16;
/** ...and each step of the flood fill is at most this big, so it follows
 * a smooth backdrop and stops at the edge of the garment. */
const BACKGROUND_STEP = 3;
/** A colour is a background colour when at least this share of the
 * border is like it: a black bar along the top of a screenshot is one, a
 * garment that merely touches the edge is not. */
const MODE_SHARE = 0.15;
/** Share of the border the background colours must cover together. */
const BORDER_AGREEMENT = 0.6;
/** Background removal that would leave less than this is a mistake: the
 * garment is the same colour as what it lies on. */
const MIN_FOREGROUND = 0.05;
/** A cluster under this share of the garment is noise, not a colour. */
const MIN_SHARE = 0.08;
/** Clusters closer than this are one colour with a shadow on it. */
const MERGE_DISTANCE = 8;
const ITERATIONS = 12;

// Thresholds read off the reference set (#119): a charcoal or a black
// shoe photographed at #1c1c1e is Black, but a navy (#0b1f3a, C 0.058) or
// a black-green (#1c2f26, C 0.03) must stay what it is, hence the low
// chroma gate. `snap` in the tests proves no reference colour changes
// anchor by being snapped.
const BLACK_MAX_L = 0.26;
const WHITE_MIN_L = 0.94;
const NEUTRAL_MAX_CHROMA = 0.025;

type Lab = [number, number, number];

export interface Pixels {
  data: ArrayLike<number>;
  width: number;
  height: number;
}

/** `#000000` or `#ffffff` for a near-black or near-white, else the hex. */
export function snapNeutralExtremes(hex: string): string {
  const { L, C } = hexToOklch(hex);
  if (C >= NEUTRAL_MAX_CHROMA) return hex;
  if (L < BLACK_MAX_L) return "#000000";
  if (L > WHITE_MIN_L) return "#ffffff";
  return hex;
}

function dist(a: Lab, b: Lab): number {
  return 100 * Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function labAt(data: ArrayLike<number>, i: number): Lab {
  return rgbToOklab(data[i * 4] / 255, data[i * 4 + 1] / 255, data[i * 4 + 2] / 255);
}

/** Indices of the pixels that belong to the garment. */
function foreground({ data, width, height }: Pixels): number[] {
  const n = width * height;

  let translucent = 0;
  for (let i = 0; i < n; i++) if (data[i * 4 + 3] < 250) translucent++;
  // A cut-out already says where the garment is.
  if (translucent > n * 0.02) {
    const keep: number[] = [];
    for (let i = 0; i < n; i++) if (data[i * 4 + 3] >= 128) keep.push(i);
    return keep;
  }

  const all = Array.from({ length: n }, (_, i) => i);
  const tooLittle = (keep: number[]) => keep.length < n * MIN_FOREGROUND;

  const border: number[] = [];
  for (let x = 0; x < width; x++) border.push(x, (height - 1) * width + x);
  for (let y = 1; y < height - 1; y++) border.push(y * width, y * width + width - 1);

  // The background colours: the dominant colours of the border, greedy,
  // so a white studio wall with a black bar on top gives two.
  const modes: { centre: Lab; count: number }[] = [];
  for (const i of border) {
    const lab = labAt(data, i);
    const mode = modes.find((m) => dist(m.centre, lab) < BACKGROUND_DISTANCE / 2);
    if (mode) mode.count++;
    else modes.push({ centre: lab, count: 1 });
  }
  const backgrounds = modes.filter((m) => m.count >= border.length * MODE_SHARE).slice(0, 3);
  const covered = backgrounds.reduce((sum, m) => sum + m.count, 0);
  if (covered < border.length * BORDER_AGREEMENT) return all;

  // Flood fill from the border, each seed spreading through pixels like
  // its own background colour and only in small steps, so it follows a
  // vignette or a soft shadow and stops at the edge of the garment.
  const owner = new Int8Array(n).fill(-1);
  const queue: number[] = [];
  for (const i of border) {
    const lab = labAt(data, i);
    const which = backgrounds.findIndex((m) => dist(m.centre, lab) < BACKGROUND_DISTANCE);
    if (which >= 0 && owner[i] < 0) {
      owner[i] = which;
      queue.push(i);
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const i = queue[head];
    const here = labAt(data, i);
    const centre = backgrounds[owner[i]].centre;
    const x = i % width;
    const neighbours = [
      x > 0 ? i - 1 : -1,
      x < width - 1 ? i + 1 : -1,
      i >= width ? i - width : -1,
      i < n - width ? i + width : -1,
    ];
    for (const j of neighbours) {
      if (j < 0 || owner[j] >= 0) continue;
      const there = labAt(data, j);
      if (dist(there, centre) < BACKGROUND_DISTANCE && dist(there, here) < BACKGROUND_STEP) {
        owner[j] = owner[i];
        queue.push(j);
      }
    }
  }
  const keep = all.filter((i) => owner[i] < 0);
  return tooLittle(keep) ? all : keep;
}

// Deterministic, so the same photo always gives the same chips.
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Cluster {
  centre: Lab;
  count: number;
}

function kMeans(points: Lab[], k: number): Cluster[] {
  const random = rng(1);
  const centres: Lab[] = [points[Math.floor(random() * points.length)]];
  while (centres.length < Math.min(k, points.length)) {
    const d2 = points.map((p) => Math.min(...centres.map((c) => dist(p, c) ** 2)));
    const total = d2.reduce((a, b) => a + b, 0);
    if (total === 0) break;
    let pick = random() * total;
    let idx = 0;
    while (idx < d2.length - 1 && pick > d2[idx]) pick -= d2[idx++];
    centres.push(points[idx]);
  }

  let assignment = new Array<number>(points.length).fill(0);
  for (let iter = 0; iter < ITERATIONS; iter++) {
    assignment = points.map((p) => {
      let best = 0;
      let bestD = Infinity;
      centres.forEach((c, ci) => {
        const d = dist(p, c);
        if (d < bestD) {
          bestD = d;
          best = ci;
        }
      });
      return best;
    });
    centres.forEach((_, ci) => {
      const members = points.filter((_, pi) => assignment[pi] === ci);
      if (members.length === 0) return;
      centres[ci] = [
        members.reduce((s, p) => s + p[0], 0) / members.length,
        members.reduce((s, p) => s + p[1], 0) / members.length,
        members.reduce((s, p) => s + p[2], 0) / members.length,
      ];
    });
  }
  return centres.map((centre, ci) => ({
    centre,
    count: assignment.filter((a) => a === ci).length,
  }));
}

/** The 0 to 3 dominant colours of the garment in the image, largest first. */
export function extractColours(pixels: Pixels): string[] {
  const keep = foreground(pixels);
  if (keep.length === 0) return [];
  const points = keep.map((i) => labAt(pixels.data, i));

  const merged: Cluster[] = [];
  for (const c of kMeans(points, MAX_COLOURS).sort((a, b) => b.count - a.count)) {
    if (c.count < points.length * MIN_SHARE) continue;
    const twin = merged.find((m) => dist(m.centre, c.centre) < MERGE_DISTANCE);
    if (twin) {
      const total = twin.count + c.count;
      twin.centre = [
        (twin.centre[0] * twin.count + c.centre[0] * c.count) / total,
        (twin.centre[1] * twin.count + c.centre[1] * c.count) / total,
        (twin.centre[2] * twin.count + c.centre[2] * c.count) / total,
      ];
      twin.count = total;
    } else {
      merged.push({ ...c });
    }
  }
  const hexes = merged
    .sort((a, b) => b.count - a.count)
    .map((c) => snapNeutralExtremes(oklabToHex(...c.centre)));
  return [...new Set(hexes)];
}
