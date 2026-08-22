/**
 * The rules about a password's shape, with no dependency on the thing
 * that hashes it: the change-password form is a Client Component and
 * needs the minimum length to render, and pulling `password.ts` in for
 * that would ship Argon2's native module to the browser (it cannot go,
 * and the build says so).
 */

/** Long enough to survive offline cracking, short of anything a password
 * manager cannot produce. No composition rules: they push people towards
 * `Password1!` and buy nothing. */
export const MIN_PASSWORD_LENGTH = 12;

/** Argon2 accepts far more, but an unbounded field is free CPU for an
 * attacker: every submitted byte is hashed before it can be rejected. */
export const MAX_PASSWORD_LENGTH = 128;

export type PasswordPolicyError = "tooShort" | "tooLong";

export function passwordPolicyError(password: string): PasswordPolicyError | null {
  if (password.length < MIN_PASSWORD_LENGTH) return "tooShort";
  if (password.length > MAX_PASSWORD_LENGTH) return "tooLong";
  return null;
}
