/**
 * Login throttling, computed from the `LoginAttempt` rows rather than
 * from a counter in memory: a container restart must not hand an
 * attacker a fresh budget of guesses.
 */

export interface Attempt {
  success: boolean;
  createdAt: Date;
}

/** Free guesses before the door starts closing. */
export const FAILURES_BEFORE_LOCK = 5;

/** First lockout; every further failure doubles it. */
export const BASE_LOCK_MS = 60_000;

/** Ceiling of the backoff. Longer than this only hurts the real owner,
 * who is the one that ever sees it. */
export const MAX_LOCK_MS = 15 * 60_000;

/**
 * How far back an attempt still counts. Old failures must expire, or a
 * mistyped password in March would shorten the fuse in April.
 */
export const ATTEMPT_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Rows must arrive newest first and cover at most `ATTEMPT_WINDOW_MS`.
 * A success clears the streak: whoever proved they own the account is
 * not the brute force we are counting.
 */
export function consecutiveFailures(attempts: Attempt[]): number {
  const firstSuccess = attempts.findIndex((a) => a.success);
  return firstSuccess === -1 ? attempts.length : firstSuccess;
}

/**
 * The instant the account (or IP) becomes usable again, or `null` if it
 * already is. `threshold` is the number of failures tolerated before the
 * first lockout — higher for an IP than for a username, see
 * `service.ts`.
 */
export function lockedUntil(
  attempts: Attempt[],
  threshold: number = FAILURES_BEFORE_LOCK,
): Date | null {
  const failures = consecutiveFailures(attempts);
  if (failures < threshold) return null;

  const exponent = failures - threshold;
  const duration = Math.min(BASE_LOCK_MS * 2 ** exponent, MAX_LOCK_MS);
  const until = new Date(attempts[0].createdAt.getTime() + duration);
  return until;
}

/** Seconds a caller should be told to wait. Rounded up: telling someone
 * to retry in 0 seconds when they cannot is worse than a second late. */
export function secondsUntil(until: Date, now: Date = new Date()): number {
  return Math.max(1, Math.ceil((until.getTime() - now.getTime()) / 1000));
}
