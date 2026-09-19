import { describe, it, expect } from "vitest";
import { setAsideRemovedCategories } from "@/lib/prendas/import";

const shirt = { category: "SHIRT", colors: ["#1b2c50"] };
const socks = { category: "SOCKS", colors: ["#000000"] };

describe("setAsideRemovedCategories", () => {
  it("drops the socks of an old export and says how many", () => {
    const { body, skipped } = setAsideRemovedCategories({
      version: 3,
      garments: [shirt, socks, socks],
    });
    expect(skipped).toBe(2);
    expect(body).toEqual({ version: 3, garments: [shirt] });
  });

  it("leaves an export without socks alone", () => {
    const input = { version: 3, garments: [shirt] };
    expect(setAsideRemovedCategories(input)).toEqual({ body: input, skipped: 0, originalIndexes: [0] });
  });

  it("does not choke on a malformed body: validation reports that", () => {
    expect(setAsideRemovedCategories(null).skipped).toBe(0);
    expect(setAsideRemovedCategories({ version: 3 }).skipped).toBe(0);
    const withJunk = { version: 3, garments: [null, "x", socks] };
    expect(setAsideRemovedCategories(withJunk).skipped).toBe(1);
  });

  it("remembers where each kept row sat in the file, for error messages", () => {
    const invalid = { category: "SHIRT", colors: [] };
    const { originalIndexes } = setAsideRemovedCategories({
      version: 3,
      garments: [socks, socks, invalid],
    });
    expect(originalIndexes).toEqual([2]);
  });
});
