import { describe, it, expect } from "vitest";
import { isSweaterInSeason } from "@/lib/prendas/season";

const AUTUMN_DAY = new Date(Date.UTC(2026, 8, 18)); // September
const SUMMER_DAY = new Date(Date.UTC(2026, 6, 15)); // July
const WINTER_DAY = new Date(Date.UTC(2026, 0, 10)); // January
const SPRING_DAY = new Date(Date.UTC(2026, 3, 20)); // April

describe("isSweaterInSeason", () => {
  it("is in season through autumn, winter and spring", () => {
    expect(isSweaterInSeason(AUTUMN_DAY)).toBe(true);
    expect(isSweaterInSeason(WINTER_DAY)).toBe(true);
    expect(isSweaterInSeason(SPRING_DAY)).toBe(true);
  });

  it("is out of season in summer", () => {
    expect(isSweaterInSeason(SUMMER_DAY)).toBe(false);
  });
});
