import type { NextAuthConfig } from "next-auth";

const SEVEN_DAYS = 7 * 24 * 60 * 60;

/**
 * Everything about the session that does not need the database.
 *
 * The proxy builds its own Auth.js instance from this alone, so the
 * per-request authorisation check never pulls Prisma, better-sqlite3 or
 * Argon2 into the file that runs before every single request. The full
 * instance in `auth.ts` adds the credentials provider on top.
 */
export const authConfig = {
  // Published behind a tunnel, so the Host header is the reverse proxy's
  // word. Without this Auth.js refuses the request as an untrusted host.
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    // Credentials never persist a session row (there is nothing to
    // revoke server-side either way), so this is a signed, encrypted
    // cookie. A week is short enough to matter and long enough that the
    // phone by the wardrobe does not ask every morning.
    strategy: "jwt",
    maxAge: SEVEN_DAYS,
  },
  callbacks: {
    /**
     * `user` is only present on the sign-in pass; afterwards the token
     * is its own source. `trigger === "update"` is how the
     * change-password action clears the flag without a new login.
     */
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id ?? token.sub ?? "";
        token.username = user.username ?? "";
        token.mustChangePw = user.mustChangePw ?? false;
      }
      if (trigger === "update" && session && typeof session === "object") {
        const patch = session as { user?: { mustChangePw?: boolean } };
        if (typeof patch.user?.mustChangePw === "boolean") {
          token.mustChangePw = patch.user.mustChangePw;
        }
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.username = token.username;
      session.user.mustChangePw = token.mustChangePw;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
