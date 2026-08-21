import Link from "next/link";
import { findAllOutfits, findWeekPlan, toSavedOutfit } from "@/lib/outfits/service";
import { findAllGarments } from "@/lib/prendas/service";
import { EXTRA_CATEGORIES } from "@/lib/prendas/types";
import { palettes } from "@/lib/colors";
import { startOfWeek, addDays, dayToISO, isoToDay } from "@/lib/outfits/week";
import { WeekCalendar } from "@/components/WeekCalendar";
import { PageContainer, SectionHeader, Icon } from "@/components/ui";

export const dynamic = "force-dynamic";

function formatWeekRange(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("ca", { day: "numeric", month: "short", timeZone: "UTC" });
  return `${fmt(start)} — ${fmt(end)}`;
}

export default async function CalendariPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  const { start: startParam } = await searchParams;
  const today = new Date();
  const weekStart = startOfWeek(startParam ? isoToDay(startParam) : today);
  const weekEnd = addDays(weekStart, 6);

  const [outfits, garments, days] = await Promise.all([
    findAllOutfits(),
    findAllGarments(),
    findWeekPlan(weekStart),
  ]);
  const savedOutfits = outfits.map(toSavedOutfit);

  return (
    <PageContainer width="full">
      <SectionHeader
        title="calendari"
        subtitle={
          savedOutfits.length === 0
            ? "encara no tens cap outfit desat per planificar."
            : "tria, per a cada dia, quin outfit desat et poses."
        }
      />

      <div className="flex items-center justify-between pb-8 gap-4">
        <Link
          href={`/calendari?start=${dayToISO(addDays(weekStart, -7))}`}
          aria-label="Setmana anterior"
          className="inline-flex items-center gap-1 font-serif italic type-small text-text-secondary hover:text-text-primary transition-colors"
        >
          <Icon name="chevron-left" size={12} />
          <span className="hidden sm:inline">setmana anterior</span>
        </Link>
        <span className="type-caption tabular-nums text-center">
          {formatWeekRange(weekStart, weekEnd)}
        </span>
        <Link
          href={`/calendari?start=${dayToISO(addDays(weekStart, 7))}`}
          aria-label="Setmana següent"
          className="inline-flex items-center gap-1 font-serif italic type-small text-text-secondary hover:text-text-primary transition-colors"
        >
          <span className="hidden sm:inline">setmana següent</span>
          <Icon name="chevron-right" size={12} />
        </Link>
      </div>

      <WeekCalendar
        days={days}
        savedOutfits={savedOutfits}
        palettes={palettes}
        extraCandidates={garments.filter((g) => EXTRA_CATEGORIES.has(g.category))}
        todayISO={dayToISO(today)}
      />
    </PageContainer>
  );
}
