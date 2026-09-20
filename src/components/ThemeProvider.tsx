"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import type { ReactNode } from "react";

export function ThemeProvider({ children, nonce }: { children: ReactNode; nonce?: string }) {
  return (
    // next-themes inlines a script that paints the right theme before first
    // paint; under the CSP it only runs if it carries the request's nonce.
    <NextThemeProvider attribute="data-theme" defaultTheme="system" enableSystem nonce={nonce}>
      {children}
    </NextThemeProvider>
  );
}
