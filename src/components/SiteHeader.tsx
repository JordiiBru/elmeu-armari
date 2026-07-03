"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SeasonIndicator from "@/components/SeasonIndicator";

export default function SiteHeader() {
  const pathname = usePathname();
  // La home te la seva propia composicio editorial amb wordmark gran.
  if (pathname === "/") return null;

  return (
    <header className="w-full px-6 md:px-12 pt-8 pb-6 flex items-center gap-3">
      <Link href="/" className="group">
        <span className="font-serif text-lg tracking-tight text-foreground">
          el meu armari
        </span>
      </Link>
      <SeasonIndicator />
    </header>
  );
}
