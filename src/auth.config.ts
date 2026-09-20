import type { NextAuthConfig } from "next-auth";
import { currentCredentials } from "@/lib/auth/credentials-version";

const SEVEN_DAYS = 7 * 24 * 60 * 60;

/**
 * Everything about the session except the credentials provider.
 *
 * The proxy builds its own Auth.js instance from this alone, so the
 * per-request authorisation check never pulls Prisma or Argon2 into the
 * file that runs before every single request. It does read one row through
 * the bare SQLite driver (`credentials-version.ts`): a JWT cannot be revoked
 * by itself, so the token carries a fingerprint of the password it was
 * issued under and the proxy compares it with the account. The full
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
    // Credentials never persist a session row, so this is a signed,
    // encrypted cookie; what makes it revocable is the password
    // fingerprint it carries (see the jwt callback), not a table. A week
    // is short enough to matter and long enough that the phone by the
    // wardrobe does not ask every morning.
    strategy: "jwt",
    maxAge: SEVEN_DAYS,
  },
  callbacks: {
    /**
     * `user` is only present on the sign-in pass; afterwards the token
     * is its own source. `pwv` is the fingerprint of the password the
     * session was issued under, compared with the account on every
     * request (see `credentials-version.ts`).
     *
     * `trigger === "update"` is how the change-password action clears
     * the temporary-password flag without a new login. What the caller
     * passes is ignored on purpose: the client-side `update()` reaches this
     * too, and a browser must not be able to write its own flag or
     * fingerprint into its token. The token is refreshed from the row.
     */
    jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id ?? token.sub ?? "";
        token.username = user.username ?? "";
        token.mustChangePw = user.mustChangePw ?? false;
        token.pwv = user.pwv ?? "";
      }
      if (trigger === "update" && token.id) {
        const current = currentCredentials(token.id);
        if (current) {
          token.pwv = current.version;
          token.mustChangePw = current.mustChangePw;
        }
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.username = token.username;
      session.user.mustChangePw = token.mustChangePw;
      session.user.pwv = token.pwv;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
