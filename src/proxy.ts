import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { decideAccess } from "@/lib/auth/access";

/**
 * `proxy.ts`, not `middleware.ts`: Next 16 renamed the convention and
 * warns on the old name (it also refuses to build if both exist). It
 * always runs on the Node.js runtime, so the Edge-compatibility dance
 * Auth.js documents for middleware does not apply — the split config is
 * kept anyway so this file never loads the database driver.
 *
 * This is the only place that decides whether a request may proceed.
 * Every route is closed unless `access.ts` names it open.
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const user = req.auth?.user;

  const decision = decideAccess({
    pathname: req.nextUrl.pathname,
    search: req.nextUrl.search,
    isAuthenticated: Boolean(user),
    mustChangePassword: user?.mustChangePw ?? false,
  });

  if (decision.type === "redirect") {
    return NextResponse.redirect(new URL(decision.to, req.nextUrl));
  }

  if (decision.type === "unauthorized") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
});

export const config = {
  /**
   * Everything except Next's own build output. The public paths are not
   * listed here but in `access.ts`, where they can be unit tested; this
   * pattern only keeps static assets from paying for a session lookup.
   */
  matcher: ["/((?!_next/static|_next/image).*)"],
};
