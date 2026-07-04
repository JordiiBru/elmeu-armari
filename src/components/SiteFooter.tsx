"use client";

import { usePathname } from "next/navigation";

/**
 * Peu editorial minim. Amagat a la home (que ja te el seu propi colofon
 * a Sanzo Wada). En interior: nom + any + colofon curt.
 */
export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  const year = new Date().getFullYear();

  return (
    <footer className="w-full px-6 md:px-10 py-8 mt-auto flex items-baseline justify-between text-[10px] tracking-[0.25em] uppercase text-foreground-secondary">
      <span>el meu armari</span>
      <span className="tabular-nums">{year}</span>
    </footer>
  );
}
