/**
 * A ceiling on how many login attempts from browsers the app does not know
 * it will hash per moment.
 *
 * Every attempt costs an Argon2id verification, unknown usernames included
 * (they burn the same time on purpose), and the pod has half a core. The
 * per-account lockout stops guessing one account; it does nothing about
 * someone trying a thousand different usernames, and the address cannot
 * help because a tunnel presents every visitor with the same one. So this
 * is a plain global budget: past it, an attempt is refused before any hash
 * is computed.
 *
 * It lives in memory on purpose. It protects the CPU, not the password (the
 * lockout table does that and survives a restart), so a restart handing out
 * a fresh budget costs nothing. Known devices (`device.ts`) never spend from
 * it, which is what keeps the owner able to sign in while someone hammers
 * the form.
 */

export const PRESSURE_WINDOW_MS = 10_000;
export const PRESSURE_MAX_ATTEMPTS = 40;

export interface PressureGuard {
  /** Spends one attempt; false means the budget is gone. */
  admit(): boolean;
  /** Looks without spending, so the form can say "busy" instead of "wrong". */
  isBusy(): boolean;
}

export function createPressureGuard(now: () => number = Date.now): PressureGuard {
  const stamps: number[] = [];

  function prune(): void {
    const cutoff = now() - PRESSURE_WINDOW_MS;
    while (stamps.length > 0 && stamps[0] <= cutoff) stamps.shift();
  }

  return {
    admit() {
      prune();
      if (stamps.length >= PRESSURE_MAX_ATTEMPTS) return false;
      stamps.push(now());
      return true;
    },
    isBusy() {
      prune();
      return stamps.length >= PRESSURE_MAX_ATTEMPTS;
    },
  };
}

// One guard per process even if Next bundles this module more than once
// (the Server Action and the Auth.js route handler are separate entries).
const globalForGuard = globalThis as unknown as { loginPressure?: PressureGuard };

export const loginPressure: PressureGuard =
  globalForGuard.loginPressure ?? (globalForGuard.loginPressure = createPressureGuard());
