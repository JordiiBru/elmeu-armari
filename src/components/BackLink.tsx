"use client";

import { useRouter } from "next/navigation";

/**
 * Enllac "enrere" que torna a la pagina anterior de l'historial.
 * Fallback al href donat si no hi ha historial (ex: entrada directa via URL).
 */
export default function BackLink({
  fallbackHref = "/",
}: {
  fallbackHref?: string;
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
      aria-label="Enrere"
      className="group relative inline-flex items-center justify-center h-8 w-8 -ml-1 text-foreground-secondary hover:text-foreground transition-colors active:scale-90"
    >
      <span aria-hidden className="font-serif text-xl leading-none transition-transform duration-300 ease-out group-hover:-translate-x-1">
        ←
      </span>
    </a>
  );
}
