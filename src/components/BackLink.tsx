import Link from "next/link";
import { Icon } from "@/components/ui";

/**
 * "Enrere" puja un nivell de la jerarquia de pantalles, sempre el mateix
 * per a una pantalla donada. No usa `router.back()`: el mateix boto ha de
 * portar al mateix lloc tant si hi has arribat navegant com si has obert
 * l'enllac directament (etiqueta NFC), i l'historial pot contenir rutes
 * que ja no son destins valids (/add despres d'un submit).
 *
 * La jerarquia viu a `SiteHeader`.
 */
export default function BackLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
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
