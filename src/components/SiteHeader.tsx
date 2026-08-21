"use client";

import { usePathname } from "next/navigation";
import BackLink from "@/components/BackLink";
import { AppMenu } from "@/components/AppMenu";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * Jerarquia de pantalles. "Enrere" puja un nivell, i cada pantalla te un
 * unic pare: es el que fa que el boto sigui previsible vinguis d'on
 * vinguis. Les pantalles de primer nivell pengen de la portada, encara
 * que una altra pantalla hi enllaci de costat (la bugaderia enllaca a
 * "Què em poso?", que es germana seva, no filla).
 */
const PARENT: { prefix: string; parent: string }[] = [
  { prefix: "/add", parent: "/armari" },
  { prefix: "/edit/", parent: "/armari" },
  { prefix: "/armari/", parent: "/armari" },
  { prefix: "/bugaderia/", parent: "/bugaderia" },
];

function parentOf(pathname: string): string {
  const match = PARENT.find(
    (e) => pathname === e.prefix || pathname.startsWith(e.prefix),
  );
  return match ? match.parent : "/";
}

export default function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="w-full px-6 md:px-10 pt-6 pb-4 flex items-center justify-between">
      {isHome ? <span /> : <BackLink href={parentOf(pathname)} />}
      <span className="flex items-center gap-1">
        <AppMenu />
        <ThemeToggle />
      </span>
    </header>
  );
}
