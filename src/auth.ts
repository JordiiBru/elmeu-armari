import { headers } from "next/headers";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { UNKNOWN_IP, clientIp } from "@/lib/auth/request";
import {
  lockoutSeconds,
  logAttempt,
  normalizeUsername,
  verifyCredentials,
} from "@/lib/auth/service";

/** Auth.js runs `authorize` inside the request it was called from, but
 * it is not contractually a request scope; an address we cannot read is
 * one we do not throttle on. */
async function requestIp(): Promise<string> {
  try {
    return clientIp(await headers());
  } catch {
    return UNKNOWN_IP;
  }
}

/**
 * One provider, no sign-up route, no e-mail flows: accounts exist
 * because the admin ran `npm run create-user`, and this is where the
 * password they were handed is checked.
 *
 * The throttling lives here rather than in the login action because
 * `authorize` is the one path both doors lead through: the form posts a
 * Server Action, but `/api/auth/callback/credentials` is a public
 * endpoint anyone can POST to directly, and a lockout it could walk past
 * would not be one.
 */
export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "username", type: "text" },
        password: { label: "password", type: "password" },
      },
      async authorize(credentials) {
        const rawUsername = credentials?.username;
        const password = credentials?.password;
        if (typeof rawUsername !== "string" || typeof password !== "string") {
          return null;
        }

        const username = normalizeUsername(rawUsername);
        const ip = await requestIp();

        // A locked-out attempt is not recorded: the backoff is already
        // as long as it is going to get, and counting refusals would
        // let an attacker hold the real owner out indefinitely.
        if ((await lockoutSeconds(username, ip)) !== null) return null;

        const user = await verifyCredentials(username, password);
        await logAttempt(username, ip, Boolean(user));
        if (!user) return null;

        return {
          id: user.id,
          name: user.username,
          username: user.username,
          mustChangePw: user.mustChangePw,
        };
      },
    }),
  ],
});
