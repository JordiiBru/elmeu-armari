import { headers } from "next/headers";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { readDeviceCookie } from "@/lib/auth/device-cookie";
import { withinCredentialLimits } from "@/lib/auth/policy";
import { UNKNOWN_IP, clientIp } from "@/lib/auth/request";
import {
  gateLogin,
  logAttempt,
  normalizeUsername,
  verifyCredentials,
} from "@/lib/auth/service";

/** Auth.js runs `authorize` inside the request it was called from, but
 * it is not contractually a request scope. The address is only recorded,
 * never throttled on: behind the tunnel it is the same for every visitor. */
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
export const { handlers, auth, signIn, signOut } = NextAuth({
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
        // Nothing this long can be a real account or password, so it is
        // neither hashed nor written down: the name is attacker-controlled
        // and lands in `LoginAttempt`.
        if (!withinCredentialLimits(username, password)) return null;

        // A locked-out or over-budget attempt is not recorded: the backoff
        // is already as long as it is going to get, and counting refusals
        // would let an attacker hold the real owner out indefinitely.
        const gate = await gateLogin(username, await readDeviceCookie(), { spend: true });
        if (!gate.ok) return null;

        const user = await verifyCredentials(username, password);
        // A known browser mistyping its own password is not evidence
        // against the account, so it does not count towards the lockout
        // that protects the account from everyone else.
        if (user || !gate.trusted) await logAttempt(username, await requestIp(), Boolean(user));
        if (!user) return null;

        return {
          id: user.id,
          name: user.username,
          username: user.username,
          mustChangePw: user.mustChangePw,
          pwv: user.pwv,
        };
      },
    }),
  ],
});
