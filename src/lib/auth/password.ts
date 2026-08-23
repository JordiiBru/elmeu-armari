import { hash, verify } from "@node-rs/argon2";
import type { Algorithm } from "@node-rs/argon2";
export {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  passwordPolicyError,
  type PasswordPolicyError,
} from "./policy";

/** `Algorithm` is an ambient `const enum`, which `isolatedModules` will
 * not let us read at runtime. Two is `Algorithm.Argon2id`. */
const ARGON2ID = 2 as Algorithm;

/**
 * OWASP's minimum recommendation for Argon2id (19 MiB, two passes, one
 * lane). They are `@node-rs/argon2`'s defaults too, but a cost parameter
 * that lives only in a library's default is one upgrade away from
 * silently changing under us.
 */
const OPTIONS = {
  algorithm: ARGON2ID,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

/**
 * A real Argon2id digest of a random string nobody knows, used to burn
 * the same ~20 ms on a username that does not exist as on one that does.
 * Without it the response time answers "is there an account called
 * `jordi`?", which is the question the generic error message exists to
 * refuse.
 */
const DUMMY_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$KGNBGkadOGjo9KX0TUDWwA$ctun1lqfokVq7ZVU8Wh1jRfiSJGf6btSmLqEZwaGPDg";

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await verify(passwordHash, password, OPTIONS);
  } catch {
    // A digest this build cannot parse is a failed login, not a 500.
    return false;
  }
}

/** Spends the verification cost when there is no account to verify
 * against. Always false. */
export async function verifyAgainstDummy(password: string): Promise<boolean> {
  return verifyPassword(DUMMY_HASH, password);
}
