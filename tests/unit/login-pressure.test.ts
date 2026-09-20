import { describe, it, expect } from "vitest";
import {
  PRESSURE_MAX_ATTEMPTS,
  PRESSURE_WINDOW_MS,
  createPressureGuard,
} from "@/lib/auth/pressure";

describe("pressure guard", () => {
  it("admits up to the budget and then refuses", () => {
    let now = 1_000;
    const guard = createPressureGuard(() => now);
    for (let i = 0; i < PRESSURE_MAX_ATTEMPTS; i++) expect(guard.admit()).toBe(true);
    expect(guard.admit()).toBe(false);
    expect(guard.isBusy()).toBe(true);
    now += 1;
    expect(guard.admit()).toBe(false);
  });

  it("recovers once the window has passed", () => {
    let now = 1_000;
    const guard = createPressureGuard(() => now);
    for (let i = 0; i < PRESSURE_MAX_ATTEMPTS; i++) guard.admit();
    now += PRESSURE_WINDOW_MS + 1;
    expect(guard.isBusy()).toBe(false);
    expect(guard.admit()).toBe(true);
  });

  it("looking does not spend", () => {
    const guard = createPressureGuard(() => 1_000);
    for (let i = 0; i < PRESSURE_MAX_ATTEMPTS * 3; i++) guard.isBusy();
    expect(guard.admit()).toBe(true);
  });
});
