import { describe, it, expect } from "vitest";
import { extractColours, snapNeutralExtremes, type Pixels } from "@/lib/colors/extract";
import { hexToOklch, oklchDistance } from "@/lib/outfits/color-matching";
import { anchorFor } from "@/lib/outfits/engine";
import { ANCHOR_CASES } from "@/lib/outfits/anchor-reference";

type Rgba = [number, number, number, number];

function image(width: number, height: number, at: (x: number, y: number) => Rgba): Pixels {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) data.set(at(x, y), (y * width + x) * 4);
  }
  return { data, width, height };
}

const rgb = (hex: string): Rgba => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
  255,
];

// A few levels of deterministic noise, as a real photo has.
function noisy(hex: string, x: number, y: number): Rgba {
  const [r, g, b] = rgb(hex);
  const n = ((x * 7 + y * 13) % 5) - 2;
  return [r + n, g + n, b + n, 255];
}

/** Two colours are the same for a person when OKLab says they are close. */
function close(a: string, b: string): boolean {
  return oklchDistance(a, b) < 4;
}

describe("extractColours", () => {
  it("returns the one colour of a flat garment", () => {
    const out = extractColours(image(32, 32, (x, y) => noisy("#7a5c3e", x, y)));
    expect(out).toHaveLength(1);
    expect(close(out[0], "#7a5c3e")).toBe(true);
  });

  it("returns two colours ordered by area", () => {
    // 65% navy, 35% mustard, side by side.
    const out = extractColours(
      image(40, 40, (x, y) => noisy(x < 26 ? "#1b2c50" : "#d4a017", x, y)),
    );
    expect(out).toHaveLength(2);
    expect(close(out[0], "#1b2c50")).toBe(true);
    expect(close(out[1], "#d4a017")).toBe(true);
  });

  it("ignores the transparent background of a cut-out", () => {
    // A red garment on nothing: the transparent part is pure black RGB,
    // which would otherwise be the biggest cluster.
    const out = extractColours(
      image(40, 40, (x, y) =>
        x >= 10 && x < 30 && y >= 8 && y < 32 ? noisy("#a10b2b", x, y) : [0, 0, 0, 0],
      ),
    );
    expect(out).toHaveLength(1);
    expect(close(out[0], "#a10b2b")).toBe(true);
  });

  it("drops the background connected to the border", () => {
    // A blue shirt on a white sheet.
    const out = extractColours(
      image(48, 48, (x, y) =>
        x >= 12 && x < 36 && y >= 10 && y < 40 ? noisy("#2e4a6b", x, y) : noisy("#f4f1ea", x, y),
      ),
    );
    expect(out).toHaveLength(1);
    expect(close(out[0], "#2e4a6b")).toBe(true);
  });

  it("keeps a colour that is enclosed by the garment, even if it matches the background", () => {
    // White sheet, a navy shirt with a white print in the middle: the
    // print is not connected to the border, so it stays a colour.
    const out = extractColours(
      image(60, 60, (x, y) => {
        const shirt = x >= 10 && x < 50 && y >= 8 && y < 52;
        const print = x >= 24 && x < 36 && y >= 22 && y < 38;
        return noisy(print ? "#ffffff" : shirt ? "#1b2c50" : "#ffffff", x, y);
      }),
    );
    expect(out.some((c) => close(c, "#1b2c50"))).toBe(true);
    expect(out).toContain("#ffffff");
  });

  it("does not mistake a garment the colour of its background for nothing", () => {
    const out = extractColours(image(32, 32, (x, y) => noisy("#e8e8e8", x, y)));
    expect(out).toHaveLength(1);
  });

  it("does not treat a busy border as a background", () => {
    // Stripes to the edge: nothing to remove, both colours are the garment.
    const out = extractColours(
      image(40, 40, (x, y) => noisy(x % 8 < 4 ? "#6d1f2b" : "#f5ecd7", x, y)),
    );
    expect(out).toHaveLength(2);
  });

  it("returns nothing for a fully transparent image", () => {
    expect(extractColours(image(16, 16, () => [0, 0, 0, 0]))).toEqual([]);
  });

  it("is deterministic", () => {
    const img = image(40, 40, (x, y) => noisy(x < 20 ? "#556b2f" : "#c19a6b", x, y));
    expect(extractColours(img)).toEqual(extractColours(img));
  });

  it("snaps a photographed black to #000000, so a black shoe stays a safe shoe", () => {
    const out = extractColours(image(32, 32, (x, y) => noisy("#1c1c1e", x, y)));
    expect(out).toEqual(["#000000"]);
  });
});

describe("snapNeutralExtremes", () => {
  it("snaps near-black and near-white greys", () => {
    expect(snapNeutralExtremes("#1c1c1e")).toBe("#000000");
    expect(snapNeutralExtremes("#f4f1ea")).toBe("#ffffff");
  });

  it("leaves coloured darks and lights alone", () => {
    expect(snapNeutralExtremes("#0b1f3a")).toBe("#0b1f3a"); // navy
    expect(snapNeutralExtremes("#1c2f26")).toBe("#1c2f26"); // black-green
    expect(snapNeutralExtremes("#fff0e0")).toBe("#fff0e0"); // warm off-white
  });

  it("leaves mid greys alone", () => {
    expect(snapNeutralExtremes("#5d5d5f")).toBe("#5d5d5f");
  });

  it("never changes how a reference colour anchors", () => {
    // The thresholds come from the #119 reference set: snapping any of
    // its colours must land on a name the set accepts (or leave it be).
    for (const c of ANCHOR_CASES) {
      const snapped = snapNeutralExtremes(c.hex);
      if (snapped === c.hex) continue;
      const name = anchorFor(snapped)?.canonical.name;
      expect(c.accept, `${c.hex} ${c.label} snapped to ${snapped}`).toContain(name);
      expect(hexToOklch(c.hex).C).toBeLessThan(0.03);
    }
  });
});
