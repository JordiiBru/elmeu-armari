import type { Metadata } from "next";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import SiteHeader from "@/components/SiteHeader";
import { ToastProvider } from "@/components/ui";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PageTitleProvider } from "@/lib/PageTitleContext";
import { fontVariables } from "./fonts";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, session, requestHeaders] = await Promise.all([getLocale(), auth(), headers()]);
  const nonce = requestHeaders.get("x-nonce") ?? undefined;

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${fontVariables} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-text-primary">
        <NextIntlClientProvider>
          <ThemeProvider nonce={nonce}>
            <ToastProvider>
              <PageTitleProvider>
                <SiteHeader
                  username={session?.user?.username ?? null}
                  locked={session?.user?.mustChangePw ?? false}
                />
                <main className="flex-1 flex flex-col">{children}</main>
              </PageTitleProvider>
            </ToastProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
