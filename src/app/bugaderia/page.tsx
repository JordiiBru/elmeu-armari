import Link from "next/link";
import { findAllGarments } from "@/lib/prendas/service";
import { isDirty, isWashable } from "@/lib/bugaderia/laundry";
import { UI } from "@/lib/prendas/ui-strings";
import { PageContainer, SectionHeader, Stack, Text, Icon } from "@/components/ui";

export const dynamic = "force-dynamic";

/**
 * Meant to be used standing in front of the wardrobe, so each entry is a
 * large target with its own live counter: the state of the laundry should
 * be readable without opening anything.
 */
function HubLink({
  href,
  label,
  count,
  disabled,
}: {
  href: string;
  label: string;
  count: string;
  /** Nothing to wash, nothing to soil: an entry that leads to an empty
   * screen should not be pressable. It already read as disabled, so it
   * may as well behave that way. */
  disabled: boolean;
}) {
  const shell =
    "flex min-h-24 items-center justify-between gap-6 border border-border px-6 py-5";
  const body = (
    <>
      <span className="flex flex-col gap-1.5">
        <span className="font-serif type-title leading-none">{label}</span>
        <Text variant="caption" tabular>
          {count}
        </Text>
      </span>
      <span className="flex-shrink-0 text-text-secondary transition-colors duration-[var(--duration-base)] group-hover:text-text-primary">
        <Icon name="arrow-right" size={16} />
      </span>
    </>
  );

  if (disabled) {
    return (
      <div aria-disabled className={`${shell} opacity-40`}>
        {body}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`group ${shell} outline-none transition-[border-color] duration-[var(--duration-base)] ease-[var(--ease-standard)] hover:border-text-primary focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background`}
    >
      {body}
    </Link>
  );
}

export default async function BugaderiaPage() {
  const garments = await findAllGarments();

  const washable = garments.filter(isWashable);
  const dirtyCount = washable.filter(isDirty).length;
  const cleanCount = washable.length - dirtyCount;

  return (
    <PageContainer width="narrow">
      <SectionHeader title={UI.bugaderia.title} subtitle={UI.bugaderia.subtitle} />

      <Stack gap={4}>
        <HubLink
          href="/bugaderia/embrutar"
          label={UI.bugaderia.soil}
          count={UI.bugaderia.cleanCount(cleanCount)}
          disabled={cleanCount === 0}
        />
        <HubLink
          href="/bugaderia/rentar"
          label={UI.bugaderia.wash}
          count={UI.bugaderia.basketCount(dirtyCount)}
          disabled={dirtyCount === 0}
        />
      </Stack>
    </PageContainer>
  );
}
