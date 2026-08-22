import { describe, it, expect } from "vitest";
import {
  BASE_LOCK_MS,
  FAILURES_BEFORE_LOCK,
  MAX_LOCK_MS,
  consecutiveFailures,
  lockedUntil,
  secondsUntil,
  type Attempt,
} from "@/lib/auth/lockout";

const NOW = new Date("2026-08-22T10:00:00.000Z");

/** Newest first, one second apart, which is how the repository returns
 * them. */
function attempts(...outcomes: boolean[]): Attempt[] {
  return outcomes.map((success, index) => ({
    success,
    createdAt: new Date(NOW.getTime() - index * 1000),
  }));
}

describe("consecutiveFailures", () => {
  it("is zero with nothing recorded", () => {
    expect(consecutiveFailures([])).toBe(0);
  });

  it("counts the run of failures at the top", () => {
    expect(consecutiveFailures(attempts(false, false, false))).toBe(3);
  });

  it("stops at the last success", () => {
    expect(consecutiveFailures(attempts(false, false, true, false, false))).toBe(2);
  });
});

describe("lockedUntil", () => {
  it("lets the first failures through", () => {
    const tolerated = Array(FAILURES_BEFORE_LOCK - 1).fill(false);
    expect(lockedUntil(attempts(...tolerated))).toBeNull();
  });

  it("locks for a minute on the fifth failure", () => {
    const until = lockedUntil(attempts(...Array(FAILURES_BEFORE_LOCK).fill(false)));
    expect(until).not.toBeNull();
    expect(until!.getTime() - NOW.getTime()).toBe(BASE_LOCK_MS);
  });

  it("doubles with every further failure", () => {
    const until = lockedUntil(
      attempts(...Array(FAILURES_BEFORE_LOCK + 3).fill(false)),
    );
    expect(until!.getTime() - NOW.getTime()).toBe(BASE_LOCK_MS * 8);
  });

  it("never locks for longer than the ceiling", () => {
    const until = lockedUntil(attempts(...Array(40).fill(false)));
    expect(until!.getTime() - NOW.getTime()).toBe(MAX_LOCK_MS);
  });

  it("forgives the streak once a login succeeds", () => {
    const rows = attempts(true, ...Array(FAILURES_BEFORE_LOCK + 2).fill(false));
    expect(lockedUntil(rows)).toBeNull();
  });

  it("takes a higher threshold for the coarser identity", () => {
    const rows = attempts(...Array(FAILURES_BEFORE_LOCK).fill(false));
    expect(lockedUntil(rows, FAILURES_BEFORE_LOCK * 4)).toBeNull();
  });

  it("measures the lockout from the last failure, not from now", () => {
    const old: Attempt[] = Array(FAILURES_BEFORE_LOCK)
      .fill(null)
      .map((_, index) => ({
        success: false,
        createdAt: new Date(NOW.getTime() - 10 * 60_000 - index * 1000),
      }));
    const until = lockedUntil(old)!;
    expect(until.getTime()).toBeLessThan(NOW.getTime());
  });
});

describe("secondsUntil", () => {
  it("rounds up, and never to zero", () => {
    expect(secondsUntil(new Date(NOW.getTime() + 1_200), NOW)).toBe(2);
    expect(secondsUntil(new Date(NOW.getTime() - 5_000), NOW)).toBe(1);
  });
});
