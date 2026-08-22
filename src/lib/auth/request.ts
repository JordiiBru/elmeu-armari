/**
 * Where the request says it came from.
 *
 * Nothing here is trustworthy on its own: a client can send any
 * `X-Forwarded-For` it likes, and when the app is published through a
 * tunnel that terminates on the Service, every visitor can arrive
 * wearing the same address. That is why the per-IP throttle is the
 * secondary one — the per-username lockout is what actually stops a
 * brute force — and why an unattributable request gets `UNKNOWN_IP`
 * rather than a shared bucket that one attacker could use to lock
 * everyone out.
 */

export const UNKNOWN_IP = "unknown";

export function clientIp(headers: Headers): string {
  const cloudflare = headers.get("cf-connecting-ip");
  if (cloudflare) return cloudflare.trim();

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const real = headers.get("x-real-ip");
  if (real) return real.trim();

  return UNKNOWN_IP;
}
