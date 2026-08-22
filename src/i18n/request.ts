import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { APP_TIME_ZONE } from "@/lib/outfits/week";
import { defaultLocale, isLocale, LOCALE_COOKIE } from "./config";
import { messages } from "./messages";

/**
 * No `[locale]` URL segment. The routing setup would rewrite every URL,
 * break the PWA's saved links and drag in the middleware layer; the locale
 * is a per-device preference, not part of a document's address. So it
 * lives in a cookie, read here on every request.
 */
export default getRequestConfig(async () => {
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(stored) ? stored : defaultLocale;

  return {
    locale,
    messages: messages[locale],
    // Dates belong to the wardrobe's day, not the server's. Same zone the
    // calendar decides "today" with.
    timeZone: APP_TIME_ZONE,
  };
});
