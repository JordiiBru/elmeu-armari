import type { Metadata } from "next";
import { Fraunces, Inter_Tight, Geist_Mono } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import { ToastProvider } from "@/components/ui";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "El meu armari",
  description: "Un estudi d'harmonia visual per al teu armari.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ca"
      className={`${fraunces.variable} ${interTight.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-text-primary">
        <ToastProvider>
          <SiteHeader />
          <main className="flex-1 flex flex-col">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
