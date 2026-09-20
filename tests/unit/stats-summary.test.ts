import { describe, it, expect } from "vitest";
import { dominantColour, leadingCategory } from "@/lib/prendas/stats";

const garment = (...hexes: string[]) => ({ colors: hexes.map((hex) => ({ hex })) });

describe("dominantColour", () => {
  it("is null for an empty wardrobe", () => {
    expect(dominantColour([])).toBeNull();
  });

  it("counts two shades that read as the same name together", () => {
    const result = dominantColour([
      garment("#000000"),
      garment("#0a0a0a"),
      garment("#ffffff"),
    ]);
    expect(result).toEqual({ name: "Black", count: 2 });
  });

  it("counts a garment once even when two of its colours read the same", () => {
    const result = dominantColour([garment("#000000", "#0a0a0a"), garment("#ffffff")]);
    expect(result?.count).toBe(1);
  });

  it("gives no vote to a colour outside the vocabulary", () => {
    // A taupe has no honest Sanzo reading (see names.test.ts).
    expect(dominantColour([garment("#8b7d72"), garment("#8b7d72")])).toBeNull();
  });
});

describe("leadingCategory", () => {
  const order = ["SHIRT", "PANTS", "SHOES"] as const;

  it("is the category with the most garments", () => {
    expect(leadingCategory({ SHIRT: 1, PANTS: 4, SHOES: 2 }, order)).toEqual({
      category: "PANTS",
      count: 4,
    });
  });

  it("is null when nothing leads with two", () => {
    expect(leadingCategory({ SHIRT: 1, PANTS: 1, SHOES: 0 }, order)).toBeNull();
  });

  it("breaks a tie in favour of the earlier category", () => {
    expect(leadingCategory({ SHIRT: 3, PANTS: 3, SHOES: 0 }, order)?.category).toBe("SHIRT");
  });
});
