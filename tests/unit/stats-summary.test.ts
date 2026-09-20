import { describe, it, expect } from "vitest";
import { colourCounts } from "@/lib/prendas/stats";

const garment = (...hexes: string[]) => ({ colors: hexes.map((hex) => ({ hex })) });

describe("colourCounts", () => {
  it("is empty for an empty wardrobe", () => {
    expect(colourCounts([])).toEqual([]);
  });

  it("orders colours by how many garments carry them", () => {
    const result = colourCounts([garment("#000000"), garment("#ffffff"), garment("#000000")]);
    expect(result).toEqual([
      { hex: "#000000", count: 2 },
      { hex: "#ffffff", count: 1 },
    ]);
  });

  it("counts a garment once per colour, whatever the case of the hex", () => {
    const result = colourCounts([garment("#AA0000", "#aa0000")]);
    expect(result).toEqual([{ hex: "#aa0000", count: 1 }]);
  });

  it("breaks a tie by hex so the order is stable", () => {
    const result = colourCounts([garment("#bb0000"), garment("#aa0000")]);
    expect(result.map((c) => c.hex)).toEqual(["#aa0000", "#bb0000"]);
  });
});
