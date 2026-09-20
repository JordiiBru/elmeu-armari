"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { CHANGE_PASSWORD_PATH, safeNextPath } from "@/lib/auth/access";
import { readDeviceCookie, rememberDevice } from "@/lib/auth/device-cookie";
import { withinCredentialLimits } from "@/lib/auth/policy";
import { gateLogin, mustChangePassword, normalizeUsername } from "@/lib/auth/service";

type LoginError =
  | { error: "missingFields" | "invalidCredentials" | "busy" | "unexpected" }
  | { error: "lockedOut"; seconds: number };

/** React 19 resets an uncontrolled form once its action returns, so the
 * username has to come back with the error or the second attempt starts
 * from an empty field. The password does not: it is never sent back. */
export type LoginState = (LoginError & { username: string }) | null;

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? "")) ?? "/";

  if (!username.trim() || !password) {
    return { error: "missingFields", username };
  }

  const normalized = normalizeUsername(username);
  if (!withinCredentialLimits(normalized, password)) {
    return { error: "invalidCredentials", username };
  }

  // `authorize` enforces the lockout and the attempt budget: it is the only
  // path every door leads through. Looking at them here as well (without
  // spending) is what turns a refusal into "try again in 40 seconds" or
  // "busy" instead of a third wrong-password message.
  const gate = await gateLogin(normalized, await readDeviceCookie(), { spend: false });
  if (!gate.ok) {
    return gate.reason === "locked"
      ? { error: "lockedOut", seconds: gate.seconds, username }
      : { error: "busy", username };
  }

  try {
    await signIn("credentials", {
      username: normalized,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // One message for "no such user", for "wrong password" and for
      // "you are locked out and did not know it". The login screen is
      // not an account-existence oracle.
      return { error: "invalidCredentials", username };
    }
    throw error;
  }

  // This browser has now proved the password, which is what lets it through
  // a lockout later (see `lib/auth/device.ts`).
  await rememberDevice(normalized);

  // `redirect` from a Server Action renders the destination in the same
  // response instead of sending the browser back through the proxy, so
  // the temporary-password gate has to be applied here too — otherwise
  // the one screen it is meant to hold shut is the one it opens onto.
  redirect((await mustChangePassword(normalized)) ? CHANGE_PASSWORD_PATH : next);
}
