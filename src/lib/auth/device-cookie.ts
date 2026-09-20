import { cookies } from "next/headers";
import { DEVICE_COOKIE, DEVICE_MAX_AGE_SECONDS } from "./device";
import { deviceTokenFor } from "./service";

/** The device cookie of the current request, or `undefined` when it has
 * none, or when this is not a request scope (Auth.js does not promise one
 * to `authorize`); either way the browser is simply not known. */
export async function readDeviceCookie(): Promise<string | undefined> {
  try {
    return (await cookies()).get(DEVICE_COOKIE)?.value;
  } catch {
    return undefined;
  }
}

/** Marks this browser as having just proved `username`'s current password.
 * Only ever called after a successful sign-in, from a Server Action. */
export async function rememberDevice(username: string): Promise<void> {
  const token = await deviceTokenFor(username);
  if (!token) return;
  (await cookies()).set(DEVICE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    // The same rule Auth.js applies to its own cookie through AUTH_URL,
    // not the proxy's word about the scheme.
    secure: (process.env.AUTH_URL ?? "").startsWith("https://"),
    path: "/",
    maxAge: DEVICE_MAX_AGE_SECONDS,
  });
}
