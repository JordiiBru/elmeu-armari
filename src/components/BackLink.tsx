import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui";

/**
 * "Back" goes up one level of the screen hierarchy, always the same one for
 * a given screen. It does not use `router.back()`: the same button has to
 * lead to the same place whether you got here by navigating or opened the
 * link directly (an NFC tag), and the history may hold routes that are no
 * longer valid destinations (/add after a submit).
 *
 * The hierarchy lives in `SiteHeader`.
 */
export default function BackLink({ href }: { href: string }) {
  const t = useTranslations("common");

  return (
    <Link
      href={href}
      aria-label={t("back")}
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
