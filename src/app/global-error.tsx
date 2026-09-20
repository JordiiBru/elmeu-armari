"use client";

import { useSyncExternalStore } from "react";
import { createTranslator } from "next-intl";
import { EdgePage } from "@/components/EdgePage";
import { Button, TEXT_LINK_CLASS } from "@/components/ui";
import { defaultLocale, isLocale, LOCALE_COOKIE } from "@/i18n/config";
import { messages } from "@/i18n/messages";
import { fontVariables } from "./fonts";
import "./globals.css";

/**
 * Renders in place of the root layout, so there is no `NextIntlClientProvider`
 * and no request to read the locale cookie from: the strings come from the
 * same JSON through `createTranslator`, and the cookie is read in the
 * browser. `useSyncExternalStore` keeps the server render and the first
 * client render on the default locale, so a Spanish reader sees no
 * hydration mismatch, only the switch.
 */
function readLocale() {
  const stored = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${LOCALE_COOKIE}=`))
    ?.split("=")[1];
  return isLocale(stored) ? stored : defaultLocale;
}

const noSubscription = () => () => {};

export default function GlobalError({ reset }: { reset: () => void }) {
  const locale = useSyncExternalStore(
    noSubscription,
    readLocale,
    () => defaultLocale,
  );
  const t = createTranslator({
    locale,
    messages: messages[locale],
    namespace: "errorPages.error",
  });

  return (
    <html lang={locale} className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-text-primary">
        <main className="flex-1 flex flex-col">
          <EdgePage title={t("title")} note={t("note")}>
            <Button variant="primary" onClick={reset}>
              {t("retry")}
            </Button>
            {/* A plain anchor: with the layout gone there is no router to
                navigate with, and a full load is what a failed page needs. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className={TEXT_LINK_CLASS}>
              {t("home")}
            </a>
          </EdgePage>
        </main>
      </body>
    </html>
  );
}
