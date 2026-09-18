import { describe, it, expect } from "vitest";
import { resolveSweaterInSeason } from "@/lib/prendas/season";

const AUTUMN_DAY = new Date(Date.UTC(2026, 8, 18)); // September
const SUMMER_DAY = new Date(Date.UTC(2026, 6, 15)); // July
const WINTER_DAY = new Date(Date.UTC(2026, 0, 10)); // January
const SPRING_DAY = new Date(Date.UTC(2026, 3, 20)); // April

describe("resolveSweaterInSeason", () => {
  it("AUTO is in season through autumn, winter and spring", () => {
    expect(resolveSweaterInSeason("AUTO", AUTUMN_DAY)).toBe(true);
    expect(resolveSweaterInSeason("AUTO", WINTER_DAY)).toBe(true);
    expect(resolveSweaterInSeason("AUTO", SPRING_DAY)).toBe(true);
  });

  it("AUTO is out of season in summer", () => {
    expect(resolveSweaterInSeason("AUTO", SUMMER_DAY)).toBe(false);
  });

  it("ON ignores the calendar entirely", () => {
    expect(resolveSweaterInSeason("ON", SUMMER_DAY)).toBe(true);
  });

  it("OFF ignores the calendar entirely", () => {
    expect(resolveSweaterInSeason("OFF", WINTER_DAY)).toBe(false);
  });
});
