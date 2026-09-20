import { NextResponse } from "next/server";
import { getUserId } from "./session";

/**
 * Defence in depth for the route handlers. `proxy.ts` already closes
 * every one of these to anonymous requests; this is the second lock, so
 * that a matcher edited later cannot quietly reopen the export of the
 * whole wardrobe. It also says whose wardrobe the request is about: every
 * handler that touches data takes the id from here and passes it down.
 * Returns the account, or the response to send.
 */
export async function requireUser(): Promise<{ userId: string } | { response: NextResponse }> {
  const userId = await getUserId();
  if (userId) return { userId };
  return { response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
}
