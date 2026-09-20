import {
  ATTEMPT_WINDOW_MS,
  FAILURES_BEFORE_LOCK,
  lockedUntil,
  secondsUntil,
} from "./lockout";
import { credentialsVersion } from "./credentials-version";
import { signDeviceToken, verifyDeviceToken } from "./device";
import { hashPassword, verifyAgainstDummy, verifyPassword } from "./password";
import { loginPressure } from "./pressure";
import { passwordPolicyError, type PasswordPolicyError } from "./policy";
import {
  deleteAttemptsBefore,
  findUserById,
  findUserByUsername,
  recentAttemptsByUsername,
  recordAttempt,
  setPassword,
  touchLastLogin,
} from "./repository";

/** Enough rows to see the streak; the window prunes the rest. */
const ATTEMPT_PAGE = 64;

export interface AuthenticatedUser {
  id: string;
  username: string;
  mustChangePw: boolean;
  /** Fingerprint of the password just verified; the session carries it. */
  pwv: string;
}

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * How long this account is closed for, or `null` if it may be tried now.
 * Checked before the password is looked at: an account under lockout must
 * not leak, through response time, whether the guess was right.
 *
 * Per account only. There is no per-address ceiling any more: behind the
 * tunnel every visitor shares one address, so it could not tell a stranger
 * from the owner and twenty failures from anyone would have locked both.
 */
export async function lockoutSeconds(username: string): Promise<number | null> {
  const since = new Date(Date.now() - ATTEMPT_WINDOW_MS);
  const attempts = await recentAttemptsByUsername(username, since, ATTEMPT_PAGE);

  const until = lockedUntil(attempts, FAILURES_BEFORE_LOCK);
  if (!until) return null;

  const now = new Date();
  return until > now ? secondsUntil(until, now) : null;
}

/** The cookie value that marks this browser as having proved `username`'s
 * current password, or `null` if there is no such account or no secret to
 * sign with. Call it right after a successful sign-in. */
export async function deviceTokenFor(username: string): Promise<string | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  const user = await findUserByUsername(normalizeUsername(username));
  if (!user) return null;
  return signDeviceToken(user.id, credentialsVersion(user.passwordHash), secret);
}

async function isTrustedDevice(username: string, token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const user = await findUserByUsername(username);
  if (!user) return false;
  return verifyDeviceToken(
    token,
    user.id,
    credentialsVersion(user.passwordHash),
    process.env.AUTH_SECRET,
  );
}

export type LoginGate =
  | { ok: true; trusted: boolean }
  | { ok: false; reason: "locked"; seconds: number }
  | { ok: false; reason: "busy" };

/**
 * Whether an attempt may reach the password check at all.
 *
 * A browser this account has signed in from before skips both limits: the
 * lockout, so a stranger's failures cannot close the door on the owner, and
 * the global budget, so someone hammering the form cannot either. Anyone
 * else is held to the account's lockout and to the budget. `spend` is
 * `true` from `authorize()`, the one path every door leads through; the
 * login action only looks (`false`), to say "busy" or "try again in 40
 * seconds" without spending a second attempt on the same click.
 */
export async function gateLogin(
  username: string,
  deviceToken: string | undefined,
  { spend }: { spend: boolean },
): Promise<LoginGate> {
  if (await isTrustedDevice(username, deviceToken)) return { ok: true, trusted: true };

  const seconds = await lockoutSeconds(username);
  if (seconds !== null) return { ok: false, reason: "locked", seconds };

  const admitted = spend ? loginPressure.admit() : !loginPressure.isBusy();
  if (!admitted) return { ok: false, reason: "busy" };

  return { ok: true, trusted: false };
}

export async function logAttempt(
  username: string,
  ip: string,
  success: boolean,
): Promise<void> {
  await recordAttempt({ username, ip, success });
  // Every attempt takes the bin out, not only a successful one: the form is
  // open to the internet, and a bot that never succeeds would otherwise
  // grow the table for as long as the owner never signs in. The table is
  // only ever read over `ATTEMPT_WINDOW_MS`, so nothing older is evidence.
  await deleteAttemptsBefore(new Date(Date.now() - ATTEMPT_WINDOW_MS));
}

/**
 * The credential check itself, with no notion of throttling — that is
 * the caller's, which is also the only place that knows the IP.
 * Returns `null` for both "no such user" and "wrong password", spending
 * the same time on each.
 */
export async function verifyCredentials(
  rawUsername: string,
  password: string,
): Promise<AuthenticatedUser | null> {
  const username = normalizeUsername(rawUsername);
  if (!username || !password) {
    await verifyAgainstDummy(password);
    return null;
  }

  const user = await findUserByUsername(username);
  if (!user) {
    await verifyAgainstDummy(password);
    return null;
  }

  if (!(await verifyPassword(user.passwordHash, password))) return null;

  await touchLastLogin(user.id);
  return {
    id: user.id,
    username: user.username,
    mustChangePw: user.mustChangePw,
    pwv: credentialsVersion(user.passwordHash),
  };
}

/**
 * Read straight from the row rather than from the session, for the one
 * moment the session cannot answer: a Server Action's `redirect` renders
 * the destination itself instead of sending the browser back through the
 * proxy, so the login has to route a temporary password itself.
 */
export async function mustChangePassword(username: string): Promise<boolean> {
  const user = await findUserByUsername(normalizeUsername(username));
  return user?.mustChangePw ?? false;
}

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; error: "wrongPassword" | "samePassword" | PasswordPolicyError };

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResult> {
  const user = await findUserById(userId);
  if (!user) return { ok: false, error: "wrongPassword" };

  if (!(await verifyPassword(user.passwordHash, currentPassword))) {
    return { ok: false, error: "wrongPassword" };
  }

  const policy = passwordPolicyError(newPassword);
  if (policy) return { ok: false, error: policy };

  if (newPassword === currentPassword) return { ok: false, error: "samePassword" };

  await setPassword(user.id, await hashPassword(newPassword));
  return { ok: true };
}
