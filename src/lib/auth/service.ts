import {
  ATTEMPT_WINDOW_MS,
  FAILURES_BEFORE_LOCK,
  lockedUntil,
  secondsUntil,
} from "./lockout";
import { hashPassword, verifyAgainstDummy, verifyPassword } from "./password";
import { passwordPolicyError, type PasswordPolicyError } from "./policy";
import { UNKNOWN_IP } from "./request";
import {
  deleteAttemptsBefore,
  findUserById,
  findUserByUsername,
  recentAttemptsByIp,
  recentAttemptsByUsername,
  recordAttempt,
  setPassword,
  touchLastLogin,
} from "./repository";

/**
 * An IP is a coarser identity than an account: a household, an office or
 * a tunnel exit share one. It still gets a ceiling, four times the
 * account's, so that spraying many usernames from one place is not free.
 */
const IP_FAILURES_BEFORE_LOCK = FAILURES_BEFORE_LOCK * 4;

/** Enough rows to see the streak; the window prunes the rest. */
const ATTEMPT_PAGE = 64;

/** Attempts older than this stop being evidence of anything. */
const ATTEMPT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export interface AuthenticatedUser {
  id: string;
  username: string;
  mustChangePw: boolean;
}

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * How long the caller must wait, or `null` if they may try now. Checked
 * before the password is looked at: an account under lockout must not
 * leak, through response time, whether the guess was right.
 */
export async function lockoutSeconds(
  username: string,
  ip: string,
): Promise<number | null> {
  const since = new Date(Date.now() - ATTEMPT_WINDOW_MS);

  const [byUsername, byIp] = await Promise.all([
    recentAttemptsByUsername(username, since, ATTEMPT_PAGE),
    ip === UNKNOWN_IP
      ? Promise.resolve([])
      : recentAttemptsByIp(ip, since, ATTEMPT_PAGE),
  ]);

  const untilUsername = lockedUntil(byUsername, FAILURES_BEFORE_LOCK);
  const untilIp = lockedUntil(byIp, IP_FAILURES_BEFORE_LOCK);
  const until = [untilUsername, untilIp]
    .filter((value): value is Date => value !== null)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  if (!until) return null;
  const now = new Date();
  return until > now ? secondsUntil(until, now) : null;
}

export async function logAttempt(
  username: string,
  ip: string,
  success: boolean,
): Promise<void> {
  await recordAttempt({ username, ip, success });
  if (success) {
    // A successful login is the quiet moment to take the bin out: the
    // table is only ever read over the last day.
    await deleteAttemptsBefore(new Date(Date.now() - ATTEMPT_RETENTION_MS));
  }
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
  return { id: user.id, username: user.username, mustChangePw: user.mustChangePw };
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
