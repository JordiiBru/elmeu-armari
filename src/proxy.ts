import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { decideAccess } from "@/lib/auth/access";
import { isSessionCurrent } from "@/lib/auth/credentials-version";
import { buildContentSecurityPolicy, newNonce } from "@/lib/security/csp";

/**
 * `proxy.ts`, not `middleware.ts`: Next 16 renamed the convention and
 * warns on the old name (it also refuses to build if both exist). It
 * always runs on the Node.js runtime, so the Edge-compatibility dance
 * Auth.js documents for middleware does not apply — the split config is
 * kept anyway so this file never loads the database driver.
 *
 * This is the only place that decides whether a request may proceed.
 * Every route is closed unless `access.ts` names it open. It also mints the
 * per-request CSP nonce, which is why every page is dynamic: a static page
 * cannot carry a nonce that changes on each request.
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const user = req.auth?.user;
  // A token issued under an older password is no session at all: the
  // cookie may be perfectly signed and unexpired, and still refused.
  const isAuthenticated = Boolean(user) && isSessionCurrent(user?.id, user?.pwv);

  const decision = decideAccess({
    pathname: req.nextUrl.pathname,
    search: req.nextUrl.search,
    isAuthenticated,
    mustChangePassword: user?.mustChangePw ?? false,
  });

  if (decision.type === "redirect") {
    return NextResponse.redirect(new URL(decision.to, req.nextUrl));
  }

  if (decision.type === "unauthorized") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // The nonce goes out twice on purpose. As a request header Next reads it
  // (from the CSP itself) and stamps its inline scripts; `x-nonce` is how
  // the layout hands it to next-themes. As a response header it is what the
  // browser enforces.
  const nonce = newNonce();
  const csp = buildContentSecurityPolicy(nonce, process.env.NODE_ENV !== "production");
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
});

export const config = {
  /**
   * Everything except Next's own build output. The public paths are not
   * listed here but in `access.ts`, where they can be unit tested; this
   * pattern only keeps static assets from paying for a session lookup.
   */
  matcher: ["/((?!_next/static|_next/image).*)"],
};
