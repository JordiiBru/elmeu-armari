import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isSessionCurrent } from "./credentials-version";

/**
 * The account behind this request, or `null` when there is no valid session.
 *
 * "Valid" is what `proxy.ts` decides too: a session that is not carrying a
 * temporary password and whose password fingerprint is still the account's.
 * Every read and write of a wardrobe is scoped by this id, so it is the one
 * thing a page, an action or a route handler must ask for before it touches
 * data. There is no wardrobe without an owner.
 */
export async function getUserId(): Promise<string | null> {
  const session = await auth();
  const user = session?.user;
  if (user && !user.mustChangePw && isSessionCurrent(user.id, user.pwv)) return user.id;
  return null;
}

/** For pages, layouts and Server Actions: no session means the login. */
export async function requireUserId(): Promise<string> {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  return userId;
}
