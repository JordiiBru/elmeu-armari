import { describe, it, expect } from "vitest";
import { anchorFor, candidatesFor } from "./engine";
import { hexToOklch, OKLCH_DISTANCE_THRESHOLD } from "./color-matching";

// The old engine switched strategy at chroma 0.02 and 0.05, so two
// colours a fraction of a ΔE apart on either side of one of those lines
// anchored to unrelated canonicals. Colour picked from a photo is noisy
// enough to cross them constantly.
const OLD_BOUNDARIES = [0.02, 0.05];

function oklchToHex(L: number, C: number, hDeg: number): string {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const enc = (c: number) => {
    const v = Math.min(1, Math.max(0, c));
    const g = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    return Math.round(g * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${lin.map(enc).join("")}`;
}

function deltaE(hex1: string, hex2: string): number {
  const p = hexToOklch(hex1);
  const q = hexToOklch(hex2);
  const ab = (c: typeof p) => [
    c.C * Math.cos((c.h * Math.PI) / 180),
    c.C * Math.sin((c.h * Math.PI) / 180),
  ];
  const [a1, b1] = ab(p);
  const [a2, b2] = ab(q);
  return 100 * Math.hypot(p.L - q.L, a1 - a2, b1 - b2);
}

const name = (hex: string) => anchorFor(hex)?.canonical.name ?? "(outside)";

// The threshold is a deliberate edge: a colour just past it has no
// anchor and its neighbour just inside does. Only that edge may make
// one side of a step vanish, never a change of strategy.
function nearThresholdEdge(a: string, b: string): boolean {
  const near = (hex: string) => {
    const d = anchorFor(hex)?.distance;
    return d !== undefined && d > OKLCH_DISTANCE_THRESHOLD - 1;
  };
  return (!anchorFor(a) && near(b)) || (!anchorFor(b) && near(a));
}

describe("anchor continuity across the old chroma boundaries", () => {
  // Lines of constant lightness and hue whose chroma sweeps 0 to 0.08 in
  // steps far below one ΔE: the walk crosses each old boundary once, and
  // the neighbours on either side of it must read the same.
  const lines: { label: string; L: number; h: number }[] = [
    { label: "near-black maroon", L: 0.16, h: 20 },
    { label: "dark warm brown", L: 0.3, h: 55 },
    { label: "khaki", L: 0.5, h: 65 },
    { label: "beige", L: 0.85, h: 80 },
    { label: "warm grey", L: 0.6, h: 60 },
    { label: "slate", L: 0.4, h: 245 },
    { label: "dark green", L: 0.3, h: 150 },
    { label: "sage", L: 0.8, h: 145 },
    { label: "lilac grey", L: 0.75, h: 310 },
  ];

  for (const { label, L, h } of lines) {
    it(`${label}: neighbours across chroma 0.02 and 0.05 share an anchor`, () => {
      const walk: string[] = [];
      for (let i = 0; i <= 64; i++) {
        const hex = oklchToHex(L, i * 0.00125, h);
        if (walk[walk.length - 1] !== hex) walk.push(hex);
      }

      let crossings = 0;
      for (let i = 1; i < walk.length; i++) {
        const a = walk[i - 1];
        const b = walk[i];
        expect(deltaE(a, b), `${a} -> ${b} must be a sub-ΔE step`).toBeLessThan(1);
        const ca = hexToOklch(a).C;
        const cb = hexToOklch(b).C;
        for (const edge of OLD_BOUNDARIES) {
          if (ca < edge !== cb < edge) {
            crossings++;
            if (nearThresholdEdge(a, b)) continue;
            expect(name(a), `${a} -> ${b} across chroma ${edge}`).toBe(name(b));
          }
        }
      }
      expect(crossings, "the walk must actually cross both boundaries").toBeGreaterThanOrEqual(2);
    });
  }
});

describe("candidates of a grey", () => {
  // The candidates decide which palettes a piece lives in. A grey must
  // not be willing to be a brown, a pink or a blue just because the
  // tint is faint: at the same lightness such a canonical is only a few
  // points of chroma away.
  const NOT_GREY = [
    "Vandyke Brown",
    "Fawn",
    "Ecru",
    "Light Brown Drab",
    "Grayish Lavender - B",
    "Dark Medici Blue",
  ];

  for (const hex of ["#222222", "#717171", "#8f8f8f", "#aeaeae"]) {
    it(`${hex} is only willing to be a grey`, () => {
      const names = candidatesFor(hex).map((c) => c.canonical.name);
      expect(names.length).toBeGreaterThan(0);
      for (const hued of NOT_GREY) expect(names).not.toContain(hued);
    });
  }

  it("a very dark tinted red still reads as black, not as nothing", () => {
    expect(anchorFor("#180808")?.canonical.name).toBe("Black");
  });
});
