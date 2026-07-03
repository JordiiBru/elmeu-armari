"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteHeader() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <header className="w-full px-6 md:px-12 pt-8 pb-6">
      <Link
        href="/"
        className="font-serif text-lg tracking-tight text-foreground hover:text-foreground-secondary"
      >
        el meu armari
      </Link>
    </header>
  );
}
