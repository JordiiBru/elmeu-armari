/**
 * Who may see what, as a pure function. The proxy is the only caller,
 * but keeping the decision out of it is what makes "a logged-out request
 * for /armari redirects to the login" a unit test instead of a manual
 * click.
 */

export const LOGIN_PATH = "/login";
export const CHANGE_PASSWORD_PATH = "/change-password";

/**
 * Reachable without a session. Auth.js owns `/api/auth/*` — the sign-in
 * POST lands there before there is anything to authenticate, and the
 * sign-out POST must keep working from a session we are about to reject.
 * The PWA manifest and icons carry no wardrobe data and are fetched by
 * the browser outside any navigation, so gating them only breaks the
 * install prompt.
 */
const PUBLIC_PREFIXES = ["/api/auth/", "/icons/"];
const PUBLIC_EXACT = [
  LOGIN_PATH,
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icon.svg",
];

export type AccessDecision =
  | { type: "allow" }
  | { type: "redirect"; to: string }
  /** For `/api/*`: a fetch deserves a status code, not a login page. */
  | { type: "unauthorized" };

export interface AccessRequest {
  pathname: string;
  search?: string;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
}

function isPublic(pathname: string): boolean {
  return (
    PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

function isApi(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

export function decideAccess({
  pathname,
  search = "",
  isAuthenticated,
  mustChangePassword,
}: AccessRequest): AccessDecision {
  if (isPublic(pathname)) {
    // Someone with a session has no business on the login screen; the
    // rest of the public list stays public either way.
    if (isAuthenticated && pathname === LOGIN_PATH) {
      return { type: "redirect", to: mustChangePassword ? CHANGE_PASSWORD_PATH : "/" };
    }
    return { type: "allow" };
  }

  if (!isAuthenticated) {
    if (isApi(pathname)) return { type: "unauthorized" };
    const target = `${pathname}${search}`;
    const next = target === "/" ? "" : `?next=${encodeURIComponent(target)}`;
    return { type: "redirect", to: `${LOGIN_PATH}${next}` };
  }

  // A temporary password opens exactly one door, its own replacement.
  if (mustChangePassword && pathname !== CHANGE_PASSWORD_PATH) {
    if (isApi(pathname)) return { type: "unauthorized" };
    return { type: "redirect", to: CHANGE_PASSWORD_PATH };
  }

  return { type: "allow" };
}

/**
 * The `next` parameter comes back from the URL bar, so it is attacker
 * controlled: only a path on this site may be followed. `//evil.com` is
 * a protocol-relative URL and `/\evil.com` is one to a browser that
 * normalises the backslash, which is why "starts with /" alone is not
 * the check.
 */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/\\")) return null;
  if (value === LOGIN_PATH || value.startsWith(`${LOGIN_PATH}?`)) return null;
  return value;
}
