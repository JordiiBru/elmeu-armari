import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Defence in depth for the route handlers. `proxy.ts` already closes
 * every one of these to anonymous requests; this is the second lock, so
 * that a matcher edited later cannot quietly reopen the export of the
 * whole wardrobe. Returns the response to send, or `null` to carry on.
 */
export async function requireSession(): Promise<NextResponse | null> {
  const session = await auth();
  if (session?.user && !session.user.mustChangePw) return null;
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}
