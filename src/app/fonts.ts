import { Fraunces, Inter_Tight, Geist_Mono } from "next/font/google";

/**
 * Loaded here instead of in the root layout because `global-error.tsx`
 * renders in the layout's place, and a page shown when the layout itself
 * failed still has to look like the app rather than fall back to the
 * browser's serif.
 */
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

export const fontVariables = `${fraunces.variable} ${interTight.variable} ${geistMono.variable}`;
