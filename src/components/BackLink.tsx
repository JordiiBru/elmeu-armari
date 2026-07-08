import Link from "next/link";
import { Icon } from "@/components/ui";

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
      className="group inline-flex items-center justify-center h-11 w-11 -ml-2 text-text-secondary hover:text-text-primary transition-colors duration-[var(--duration-base)] ease-[var(--ease-standard)] active:scale-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Icon
        name="chevron-left"
        size={18}
        className="transition-transform duration-[var(--duration-base)] ease-[var(--ease-standard)] group-hover:-translate-x-0.5"
      />
    </Link>
  );
}
