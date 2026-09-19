import { describe, it, expect } from "vitest";
import { anchorFor } from "./engine";
import { namedColors } from "@/lib/colors";
import { ANCHOR_CASES, type AnchorCase } from "./anchor-reference";

function anchorName(hex: string): string {
  return anchorFor(hex)?.canonical.name ?? "(outside the vocabulary)";
}

function isAccepted(c: AnchorCase): boolean {
  return c.accept.includes(anchorName(c.hex));
}

describe("anchor reference set", () => {
  it("is well formed: real names, unique hexes, enough of each kind", () => {
    const known = new Set(namedColors.map((c) => c.name));
    for (const c of ANCHOR_CASES) {
      for (const name of c.accept) {
        expect(known.has(name), `${c.hex} ${c.label}: unknown Sanzo name "${name}"`).toBe(true);
      }
    }
    const hexes = ANCHOR_CASES.map((c) => c.hex);
    expect(new Set(hexes).size).toBe(hexes.length);
    expect(ANCHOR_CASES.filter((c) => c.source === "wardrobe").length).toBeGreaterThanOrEqual(30);
    expect(ANCHOR_CASES.filter((c) => c.source === "synthetic").length).toBeGreaterThanOrEqual(40);
  });

  describe.each(ANCHOR_CASES)("$hex $label", (c) => {
    const check = () => {
      expect(c.accept, `snapped to "${anchorName(c.hex)}"`).toContain(anchorName(c.hex));
    };
    // `it.fails` passes while the anchor is wrong and fails the moment
    // it is right, which is the cue to drop `failsToday` from the case.
    if (c.failsToday) it.fails(`expected failure: ${c.failsToday}`, check);
    else it("anchors to an acceptable name", check);
  });

  it("reports the pass rate and lists every miss", () => {
    const misses = ANCHOR_CASES.filter((c) => !isAccepted(c));
    const expected = misses.filter((c) => c.failsToday);
    const unexpected = misses.filter((c) => !c.failsToday);
    const passed = ANCHOR_CASES.length - misses.length;

    console.info(
      `anchor reference set: ${passed}/${ANCHOR_CASES.length} pass ` +
        `(${((100 * passed) / ANCHOR_CASES.length).toFixed(0)}%), ` +
        `${expected.length} recorded expected failures`,
    );
    for (const c of misses) {
      console.info(`  ${c.failsToday ? "known " : "NEW   "} ${c.hex} ${c.label}: ${anchorName(c.hex)}`);
    }

    expect(unexpected.map((c) => `${c.hex} ${c.label}: ${anchorName(c.hex)}`)).toEqual([]);
    // A case flagged as failing that now passes must be unflagged.
    expect(
      ANCHOR_CASES.filter((c) => c.failsToday && isAccepted(c)).map((c) => c.hex),
    ).toEqual([]);
  });
});
