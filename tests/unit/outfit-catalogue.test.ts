import { describe, it, expect } from "vitest";
import { catalogueNumbers } from "@/lib/outfits/catalogue";

describe("catalogueNumbers", () => {
  it("numbers outfits by the order they were saved, from 1", () => {
    const numbers = catalogueNumbers([
      { id: "c", createdAt: new Date("2026-03-01") },
      { id: "a", createdAt: new Date("2026-01-01") },
      { id: "b", createdAt: new Date("2026-02-01") },
    ]);
    expect(numbers).toEqual({ a: 1, b: 2, c: 3 });
  });

  it("gives a newly saved outfit the next number instead of n001", () => {
    const before = [
      { id: "a", createdAt: new Date("2026-01-01") },
      { id: "b", createdAt: new Date("2026-02-01") },
    ];
    const after = catalogueNumbers([{ id: "new", createdAt: new Date("2026-11-04") }, ...before]);
    expect(after.new).toBe(3);
    expect(after.a).toBe(1);
  });
});
