/**
 * Which `Host` names this app answers to.
 *
 * The tunnel that publishes the app does not go through Traefik, so
 * nothing in front of the pod filters by name any more: the app has to. An
 * allowlist and not a denylist, so that a second hostname pointing here, or
 * a tunnel that rewrote `Host`, is refused instead of walking in.
 *
 * The public name is read from `AUTH_URL`, which the deployment already sets
 * to the origin the app is served from. If it goes missing the check fails
 * closed (only `localhost` and IP addresses are left), which shows up at
 * once, where a denylist that lost its variable would quietly stop denying.
 *
 * IP addresses are always allowed: the kubelet's probes and a `docker run`
 * on a LAN arrive with the address as `Host`, and refusing the probe would
 * restart the pod forever. A name is what a visitor from the internet has
 * to use, and that is what is checked.
 */

function hostname(hostHeader: string): string {
  const value = hostHeader.trim().toLowerCase();
  if (value.startsWith("[")) return value.slice(0, value.indexOf("]") + 1);
  return value.split(":")[0];
}

function isIpAddress(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || (host.startsWith("[") && host.endsWith("]"));
}

export function allowedHostnames(authUrl: string | undefined): Set<string> {
  const names = new Set(["localhost"]);
  if (authUrl) {
    try {
      names.add(new URL(authUrl).hostname.toLowerCase());
    } catch {
      // A malformed AUTH_URL adds nothing: closed, not open.
    }
  }
  return names;
}

export function isAllowedHost(hostHeader: string | null, authUrl: string | undefined): boolean {
  if (!hostHeader) return false;
  const host = hostname(hostHeader);
  return isIpAddress(host) || allowedHostnames(authUrl).has(host);
}
