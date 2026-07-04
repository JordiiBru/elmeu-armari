"use client";

import { usePathname } from "next/navigation";
import BackLink from "@/components/BackLink";

/**
 * Fallback per rutes que teoricament sempre vindran d'un lloc concret.
 * Aixo evita que un "enrere" acabi a la home per accident.
 */
function fallbackFor(pathname: string): string {
  if (pathname === "/add") return "/armari";
  if (pathname.startsWith("/edit/")) return "/armari";
  return "/";
}

export default function SiteHeader() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <header className="w-full px-6 md:px-10 pt-6 pb-4">
      <BackLink fallbackHref={fallbackFor(pathname)} />
    </header>
  );
}
