"use server";

import { redirect } from "next/navigation";
import { auth, signOut, unstable_update } from "@/auth";
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
    // The flag the proxy gates on, and the password fingerprint the session
    // is checked against, live in the session cookie, so the row being
    // updated is not enough: without this the user would be sent straight
    // back to this screen, or signed out by their own password change. The
    // token is refreshed from the row; nothing is passed in.
    await unstable_update({});
  } catch {
    // Rather than loop on a stale cookie, ask for the new password once.
    await signOut({ redirectTo: "/login" });
  }

  redirect("/");
}
