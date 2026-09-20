import { describe, it, expect } from "vitest";
import { colourName } from "./names";
import { anchorFor } from "@/lib/outfits/engine";
import { ANCHOR_CASES } from "@/lib/outfits/anchor-reference";
import { namedColors } from "@/lib/colors";
import { oklchDistance } from "@/lib/outfits/color-matching";

describe("colourName", () => {
  it("is the engine's anchor for every colour of the reference set", () => {
    for (const c of ANCHOR_CASES) {
      expect(colourName(c.hex), `${c.hex} ${c.label}`).toBe(anchorFor(c.hex)?.canonical.name ?? null);
    }
  });

  it("names a colour by an acceptable Sanzo name, as the reference set judges it", () => {
    for (const c of ANCHOR_CASES) {
      if (c.failsToday) continue;
      const name = colourName(c.hex) ?? "(outside the vocabulary)";
      expect(c.accept, `${c.hex} ${c.label}`).toContain(name);
    }
  });

  it("does not give a colour outside the vocabulary a wrong name", () => {
    // Sanzo Wada has no taupe: the engine leaves it out and so does the name.
    expect(anchorFor("#8b7d72")).toBeNull();
    expect(colourName("#8b7d72")).toBeNull();
  });

  it("is case-insensitive and repeatable", () => {
    expect(colourName("#736251")).toBe(colourName("#736251".toUpperCase()));
    expect(colourName("#736251")).toBe(colourName("#736251"));
  });

  it("would have disagreed with the plain nearest-name search the interface used to run", () => {
    // Documents why this exists: the old helper ranked all 157 colours by raw
    // OKLCH distance. On the reference set it named at least one colour
    // differently from the engine's anchor.
    const plain = (hex: string) =>
      namedColors.reduce((best, c) => (oklchDistance(hex, c.hex) < oklchDistance(hex, best.hex) ? c : best)).name;
    const disagreements = ANCHOR_CASES.filter((c) => plain(c.hex) !== colourName(c.hex));
    expect(disagreements.length).toBeGreaterThan(0);
  });
});
