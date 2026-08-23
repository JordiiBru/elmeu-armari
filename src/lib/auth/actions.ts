"use server";

import { signOut } from "@/auth";

/**
 * Not next to a route, like `i18n/actions.ts` and for the same reason:
 * the control lives in the header menu, which every screen renders.
 */
export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
