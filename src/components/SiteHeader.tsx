"use client";

import { usePathname } from "next/navigation";
import BackLink from "@/components/BackLink";
import { AppMenu } from "@/components/AppMenu";

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
];

function parentOf(pathname: string): string {
  const match = PARENT.find(
    (e) => pathname === e.prefix || pathname.startsWith(e.prefix),
  );
  return match ? match.parent : "/";
}

export default function SiteHeader({
  username,
  locked,
}: {
  username: string | null;
  /** Signed in, but still carrying the temporary password. */
  locked: boolean;
}) {
  const pathname = usePathname();
  // Signed out there is one screen and nowhere above it, and a locked
  // account has only the one it is on, so in both cases the back arrow
  // would bounce off the proxy and land right back here.
  const isHome = pathname === "/" || !username || locked;

  return (
    <header className="w-full px-6 md:px-10 pt-6 pb-4 flex items-center justify-between">
      {isHome ? <span /> : <BackLink href={parentOf(pathname)} />}
      <AppMenu username={username} locked={locked} />
    </header>
  );
}
