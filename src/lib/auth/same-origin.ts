import { NextResponse } from "next/server";

/**
 * Refuses a state-changing request that a page on another origin caused.
 *
 * `SameSite=Lax` only separates *sites*, and this domain hosts other
 * services: a `multipart/form-data` or text `fetch` from a sibling
 * subdomain is a "simple" request, carries the cookie and needs no
 * preflight. Browsers say where a request came from in `Sec-Fetch-Site`;
 * older ones only send `Origin`. A request with neither is not a browser
 * acting for a page (curl, a script), which has no ambient cookie to abuse.
 */
export function requireSameOrigin(request: Request): NextResponse | null {
  const site = request.headers.get("sec-fetch-site");
  const origin = request.headers.get("origin");
  let same = true;
  if (site) {
    same = site === "same-origin" || site === "none";
  } else if (origin) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    try {
      same = new URL(origin).host === host;
    } catch {
      same = false;
    }
  }
  return same ? null : NextResponse.json({ error: "cross-origin request refused" }, { status: 403 });
}
