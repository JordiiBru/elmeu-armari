import Link from "next/link";
import {
  findAllOutfits,
  findTodayWorn,
  findWeekPlan,
  findSavedOutfitKeys,
  toSavedOutfit,
} from "@/lib/outfits/service";
import { findAllGarments } from "@/lib/prendas/service";
import { getCurrentSeason } from "@/lib/prendas/season";
import { EXTRA_CATEGORIES } from "@/lib/prendas/types";
import { isWearable, rankOutfitsForToday } from "@/lib/bugaderia/laundry";
import { startOfWeek, addDays, dayToISO, isoToDay } from "@/lib/outfits/week";
import { palettes } from "@/lib/colors";
import { TodayPlate } from "@/components/TodayPlate";
import { WeekCalendar } from "@/components/WeekCalendar";
import { OutfitLibrary } from "@/components/OutfitLibrary";
import { UI } from "@/lib/prendas/ui-strings";
import { PageContainer, SectionHeader, Stack, Text, Icon, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

function formatWeekRange(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("ca", { day: "numeric", month: "short", timeZone: "UTC" });
  return `${fmt(start)} — ${fmt(end)}`;
}

/**
 * One heading per stratum, in the page's quietest voice. They are what
 * turns a long scroll into three named places.
 */
function Stratum({
  id,
  title,
  aside,
  children,
}: {
  id?: string;
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Stack as="section" id={id} gap={5} className="scroll-mt-6">
      <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
        <Text variant="caption" as="h2">
          {title}
        </Text>
        {aside}
      </div>
      {children}
    </Stack>
  );
}

function WeekNav({ weekStart, weekEnd }: { weekStart: Date; weekEnd: Date }) {
  const link =
    "inline-flex items-center gap-1 font-serif italic type-small text-text-secondary hover:text-text-primary transition-colors duration-[var(--duration-base)]";
  return (
    <div className="flex items-baseline gap-4">
      {/* scroll={false}: App Router resets the scroll on navigation, and
          these two only change the seven cells beside them. Being thrown
          back to the top of the page to look at the next week is not what
          pressing an arrow asks for. */}
      <Link
        href={`/avui?start=${dayToISO(addDays(weekStart, -7))}`}
        aria-label="Setmana anterior"
        scroll={false}
        className={link}
      >
        <Icon name="chevron-left" size={12} />
      </Link>
      <Text variant="caption" tabular>
        {formatWeekRange(weekStart, weekEnd)}
      </Text>
      <Link
        href={`/avui?start=${dayToISO(addDays(weekStart, 7))}`}
        aria-label="Setmana següent"
        scroll={false}
        className={link}
      >
        <Icon name="chevron-right" size={12} />
      </Link>
    </div>
  );
}

/**
 * "Què em poso?" — the one place outfits live, in three strata: the
 * day's answer, the week it sits in, and the whole collection. Same
 * noun at three distances in time, so they belong on one screen rather
 * than behind three tabs and two routes.
 */
export default async function AvuiPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  const { start: startParam } = await searchParams;
  const today = new Date();
  const weekStart = startOfWeek(startParam ? isoToDay(startParam) : today);
  const weekEnd = addDays(weekStart, 6);

  const [outfits, garments, todayWorn, days, savedOutfitKeys] = await Promise.all([
    findAllOutfits(),
    findAllGarments(),
    findTodayWorn(),
    findWeekPlan(weekStart),
    findSavedOutfitKeys(),
  ]);
  const todayOutfitId = todayWorn?.outfitId ?? null;

  const season = getCurrentSeason();
  const todayISO = dayToISO(today);
  const extraCandidates = garments.filter((g) => EXTRA_CATEGORIES.has(g.category));

  // Ranked once, on the server, and shared by both the plate and the
  // grid: the proposal at the top of the page and the first tile of the
  // collection must never disagree about what comes first.
  const ranked = rankOutfitsForToday(outfits.map(toSavedOutfit), season);
  const committed = ranked.find((o) => o.id === todayOutfitId) ?? null;

  // Every stratum has its own empty state, and with nothing saved yet all
  // three fired at once — three ways of saying the same thing stacked
  // down an empty page. Say it once.
  if (ranked.length === 0) {
    return (
      <PageContainer width="wide">
        <SectionHeader title={UI.outfits.screenTitle} level="title-xl" />
        <EmptyState
          title={UI.outfits.emptyNoOutfitsBrowse}
          hint={UI.outfits.emptyNoOutfitsHint}
          action={
            <Link
              href="/armari"
              className="font-serif italic type-small text-text-secondary hover:text-text-primary transition-colors duration-[var(--duration-base)]"
            >
              {UI.outfits.goToArmari}
            </Link>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer width="full">
      <SectionHeader title={UI.outfits.screenTitle} level="title-xl" />

      <Stack gap={8} className="md:gap-16">
        <Stratum title={UI.outfits.sections.today}>
          <TodayPlate
            committed={committed}
            candidates={ranked.filter(isWearable)}
            todayExtras={todayWorn?.extras ?? []}
            palettes={palettes}
            extraCandidates={extraCandidates}
            todayISO={todayISO}
          />
        </Stratum>

        <Stratum
          title={UI.outfits.sections.week}
          aside={<WeekNav weekStart={weekStart} weekEnd={weekEnd} />}
        >
          <WeekCalendar
            days={days}
            savedOutfits={ranked}
            palettes={palettes}
            extraCandidates={extraCandidates}
            todayISO={todayISO}
          />
        </Stratum>

        <Stratum id="tots-els-outfits" title={UI.outfits.sections.all}>
          <OutfitLibrary
            outfits={ranked}
            allGarments={garments}
            palettes={palettes}
            extraCandidates={extraCandidates}
            savedOutfitKeys={savedOutfitKeys}
            todayISO={todayISO}
            todayOutfitId={todayOutfitId}
          />
        </Stratum>
      </Stack>
    </PageContainer>
  );
}
