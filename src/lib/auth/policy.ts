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

/** What `create-user` accepts, and therefore the longest name that can
 * exist. Anything longer is refused before it is looked up, hashed or
 * stored: the login form is open to the internet and the name is written
 * to `LoginAttempt`. */
export const MAX_USERNAME_LENGTH = 32;

/** Whether a login attempt could possibly be a real one. A password longer
 * than the policy allows cannot be anyone's, so it is never hashed. */
export function withinCredentialLimits(username: string, password: string): boolean {
  return username.length <= MAX_USERNAME_LENGTH && password.length <= MAX_PASSWORD_LENGTH;
}
