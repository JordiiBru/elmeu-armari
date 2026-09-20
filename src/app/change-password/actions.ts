"use server";

import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/auth";
import { changePassword } from "@/lib/auth/service";

export type ChangePasswordState = {
  error:
    | "missingFields"
    | "mismatch"
    | "wrongPassword"
    | "samePassword"
    | "tooShort"
    | "tooLong";
} | null;

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (!current || !next || !confirmation) return { error: "missingFields" };
  if (next !== confirmation) return { error: "mismatch" };

  const result = await changePassword(session.user.id, current, next);
  if (!result.ok) return { error: result.error };

  try {
    // The session cookie carries the temporary-password flag and the
    // fingerprint of the password it was issued under, and the old one
    // holds the old password's: it is refused from this moment, by design,
    // and a token can never be updated into a valid one (see the jwt
    // callback). So the change ends with a sign-in under the new password,
    // which is the one thing that proves it, and which replaces the cookie.
    await signIn("credentials", {
      username: session.user.username,
      password: next,
      redirect: false,
    });
  } catch {
    // Rather than loop on a stale cookie, ask for the new password once.
    await signOut({ redirectTo: "/login" });
  }

  redirect("/");
}
