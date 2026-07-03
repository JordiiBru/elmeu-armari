"use client";

import { useRouter } from "next/navigation";

/**
 * Enllac "enrere" que torna a la pagina anterior de l'historial.
 * Fallback al href donat si no hi ha historial (ex: entrada directa via URL).
 */
export default function BackLink({
  fallbackHref = "/",
  label = "enrere",
}: {
  fallbackHref?: string;
  label?: string;
}) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      e.preventDefault();
      router.back();
    }
  };

  return (
    <a
      href={fallbackHref}
      onClick={handleClick}
      className="inline-flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase text-foreground-secondary hover:text-foreground transition-colors active:scale-95"
    >
      <span aria-hidden>←</span>
      {label}
    </a>
  );
}
