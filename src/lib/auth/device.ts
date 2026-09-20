import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * A browser that has already proved this account's current password.
 *
 * Published through a tunnel, every visitor shares one address, so nothing
 * tells a stranger from the owner except what the owner has and the
 * stranger has not. The per-account lockout is what stops guessing, and
 * left alone it also lets anyone who knows the username keep the owner out
 * of their own wardrobe with one wrong password every fifteen minutes. This
 * cookie is the way round it: a browser that logged in successfully before
 * is not locked out and is not counted, so a stranger's failures cannot
 * close the door on it.
 *
 * It is a signature over the account id and the fingerprint of the password
 * hash (`credentialsVersion`), so changing the password, or
 * `create-user --reset`, ends the trust of every device at once, the same
 * way it ends every session. It grants nothing on its own: the password is
 * still checked.
 */

export const DEVICE_COOKIE = "armari_device";

/** Long on purpose: the point is that it outlives a session. */
export const DEVICE_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;

function signature(userId: string, version: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`armari-device:${userId}:${version}`)
    .digest("base64url");
}

export function signDeviceToken(userId: string, version: string, secret: string): string {
  return `${userId}.${version}.${signature(userId, version, secret)}`;
}

/** Whether `token` was issued for exactly this account and this password. A
 * missing secret, a malformed token or a token from another password is
 * simply not trusted; nothing here can throw. */
export function verifyDeviceToken(
  token: string | undefined,
  userId: string,
  version: string,
  secret: string | undefined,
): boolean {
  if (!token || !secret) return false;
  const expected = Buffer.from(signDeviceToken(userId, version, secret));
  const given = Buffer.from(token);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
