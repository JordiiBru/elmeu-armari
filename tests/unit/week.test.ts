import { describe, it, expect, afterEach, vi } from "vitest";
import { today, dayKey, daysBetween, startOfWeek, dayToISO } from "@/lib/outfits/week";

/** An instant, described in UTC — which is what the container's clock
 * reports and what `dayKey(new Date())` used to read the day off. */
function at(iso: string): Date {
  return new Date(iso);
}

describe("today()", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("has already turned over at 00:30 in Barcelona summer (UTC+2)", () => {
    // 22:30 UTC on the 21st is 00:30 on the 22nd in Barcelona.
    expect(dayToISO(today(at("2026-08-21T22:30:00Z")))).toBe("2026-08-22");
  });

  it("has already turned over at 00:30 in Barcelona winter (UTC+1)", () => {
    expect(dayToISO(today(at("2026-01-14T23:30:00Z")))).toBe("2026-01-15");
  });

  it("does not turn over early at 23:30 local", () => {
    // 21:30 UTC is 23:30 in Barcelona on the same day.
    expect(dayToISO(today(at("2026-08-22T21:30:00Z")))).toBe("2026-08-22");
  });

  it("is the day the old UTC reading got wrong", () => {
    const instant = at("2026-08-21T22:30:00Z");
    expect(dayToISO(dayKey(instant))).toBe("2026-08-21");
    expect(dayToISO(today(instant))).toBe("2026-08-22");
  });

  it("returns a UTC-midnight key, like every stored day", () => {
    const day = today(at("2026-08-21T22:30:00Z"));
    expect(day.getUTCHours()).toBe(0);
    expect(day.toISOString()).toBe("2026-08-22T00:00:00.000Z");
  });

  it("defaults to now", () => {
    vi.useFakeTimers();
    vi.setSystemTime(at("2026-08-21T22:30:00Z"));
    expect(dayToISO(today())).toBe("2026-08-22");
  });

  it("puts the week the day belongs to on the right Monday", () => {
    // 00:30 Barcelona on Monday the 24th: the week must already be that
    // Monday's, not the previous Sunday's.
    expect(dayToISO(startOfWeek(today(at("2026-08-23T22:30:00Z"))))).toBe("2026-08-24");
  });
});

describe("daysBetween()", () => {
  it("counts whole calendar days, not elapsed hours", () => {
    // Worn late yesterday, read early today: one day, not zero.
    expect(daysBetween(at("2026-08-20T00:00:00Z"), at("2026-08-21T00:00:00Z"))).toBe(1);
  });

  it("is zero for the same day", () => {
    expect(daysBetween(at("2026-08-21T00:00:00Z"), at("2026-08-21T00:00:00Z"))).toBe(0);
  });

  it("survives a DST boundary", () => {
    // The last Sunday of October: 25 October 2026 is a 25-hour day in
    // Barcelona, so an hours-based count would drift.
    expect(daysBetween(at("2026-10-24T00:00:00Z"), at("2026-10-26T00:00:00Z"))).toBe(2);
  });
});
