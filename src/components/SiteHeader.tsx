"use client";

import { usePathname } from "next/navigation";
import BackLink from "@/components/BackLink";

export default function SiteHeader() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <header className="w-full px-6 md:px-10 pt-6 pb-4">
      <BackLink fallbackHref="/" label="enrere" />
    </header>
  );
}
