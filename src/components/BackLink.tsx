import Link from "next/link";

/**
 * Enllac "enrere" com a breadcrumb determinista.
 * No usa router.back() perque l'historial pot contenir rutes que ja no
 * son destins valids (ex: /add despres de submit reemplaçat amb /armari).
 */
export default function BackLink({
  fallbackHref = "/",
}: {
  fallbackHref?: string;
}) {
  return (
    <Link
      href={fallbackHref}
      aria-label="Enrere"
      className="group relative inline-flex items-center justify-center h-8 w-8 -ml-1 text-foreground-secondary hover:text-foreground transition-colors active:scale-90"
    >
      <span aria-hidden className="font-serif text-xl leading-none transition-transform duration-300 ease-out group-hover:-translate-x-1">
        ←
      </span>
    </Link>
  );
}
