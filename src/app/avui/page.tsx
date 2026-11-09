import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import {
  findAllOutfits,
  findSavedOutfitKeys,
  findTodayWorn,
  findWeekPlan,
  toSavedOutfit,
} from "@/lib/outfits/service";
import { findAllGarments } from "@/lib/prendas/service";
import { getCurrentSeason } from "@/lib/prendas/season";
import { EXTRA_CATEGORIES } from "@/lib/prendas/types";
import { isWearable, rankOutfitsForToday } from "@/lib/bugaderia/laundry";
import {
  startOfWeek,
  addDays,
  dayToISO,
  isoToDay,
  today,
} from "@/lib/outfits/week";
import { palettes } from "@/lib/colors";
import { catalogueNumbers } from "@/lib/outfits/catalogue";
import { TodayLine } from "@/components/TodayLine";
import { WeekCalendar } from "@/components/WeekCalendar";
import { OutfitStudio } from "@/components/OutfitStudio";
import {
  PageContainer,
  SectionHeader,
  Stack,
  Text,
  Icon,
  EmptyState,
} from "@/components/ui";
import { requireUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function formatWeekRange(start: Date, end: Date, locale: string): string {
  const fmt = (d: Date) =>
    // Both ends are UTC-midnight day keys, so they are read back in UTC.
    // Which day they name was already settled in Barcelona's zone.
    d.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  return `${fmt(start)} — ${fmt(end)}`;
}

function WeekNav({
  weekStart,
  weekEnd,
  locale,
  labels,
}: {
  weekStart: Date;
  weekEnd: Date;
  locale: string;
  labels: { previous: string; next: string };
}) {
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
        aria-label={labels.previous}
        scroll={false}
        className={link}
      >
        <Icon name="chevron-left" size={12} />
      </Link>
      <Text variant="caption" tabular>
        {formatWeekRange(weekStart, weekEnd, locale)}
      </Text>
      <Link
        href={`/avui?start=${dayToISO(addDays(weekStart, 7))}`}
        aria-label={labels.next}
        scroll={false}
        className={link}
      >
        <Icon name="chevron-right" size={12} />
      </Link>
    </div>
  );
}

/**
 * "Què em poso?" — the one place outfits live. The builder leads: build
 * a look piece by piece and watch its palette form, with every saved
 * outfit under it, narrowed by the same taps. The week closes the page:
 * it is where a decided outfit goes, not where one is decided.
 */
export default async function AvuiPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  const { start: startParam } = await searchParams;
  const [t, tWeek, locale] = await Promise.all([
    getTranslations("outfits"),
    getTranslations("week"),
    getLocale(),
  ]);
  const currentDay = today();
  const weekStart = startOfWeek(startParam ? isoToDay(startParam) : currentDay);
  const weekEnd = addDays(weekStart, 6);

  const userId = await requireUserId();
  const [outfits, garments, todayWorn, days, savedOutfitKeys] =
    await Promise.all([
      findAllOutfits(userId),
      findAllGarments(userId),
      findTodayWorn(userId),
      findWeekPlan(userId, weekStart),
      findSavedOutfitKeys(userId),
    ]);
  const todayOutfitId = todayWorn?.outfitId ?? null;

  const season = getCurrentSeason();
  const todayISO = dayToISO(currentDay);
  const extraCandidates = garments.filter((g) =>
    EXTRA_CATEGORIES.has(g.category),
  );

  // Ranked once, on the server. The week and today's line take the
  // favourites: favouriting is what puts an outfit into daily rotation.
  const allSaved = outfits.map(toSavedOutfit);
  const favorites = allSaved.filter((o) => o.favorite);
  const ranked = rankOutfitsForToday(favorites, season);
  // The builder's collection shows every saved outfit (favourites is a
  // toggle there), and numbers them off this same list.
  const allRanked = rankOutfitsForToday(allSaved, season);
  const numbers = catalogueNumbers(allSaved);
  const committed = ranked.find((o) => o.id === todayOutfitId) ?? null;

  // The only real dead end is an empty wardrobe: with nothing to wear
  // there is nothing this page can offer beyond a way to add clothes.
  // Zero favourites is not that — "descobreix" turns straight into a
  // wardrobe browser the moment nothing is saved yet, so the week and
  // the collection still render around it.
  if (garments.length === 0) {
    return (
      <PageContainer width="wide">
        <SectionHeader title={t("screenTitle")} level="title-xl" />
        <EmptyState
          title={t("emptyWardrobe")}
          hint={t("emptyWardrobeHint")}
          action={
            <Link
              href="/armari"
              className="font-serif italic type-small text-text-secondary hover:text-text-primary transition-colors duration-[var(--duration-base)]"
            >
              {t("goToArmari")}
            </Link>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer width="full">
      <SectionHeader title={t("screenTitle")} level="title-xl" />

      <OutfitStudio
        garments={garments}
        outfits={allRanked}
        palettes={palettes}
        extraCandidates={extraCandidates}
        savedOutfitKeys={savedOutfitKeys}
        todayISO={todayISO}
        todayOutfitId={todayOutfitId}
        season={season}
        numbers={numbers}
      >
        <Stack as="section" id="setmana" gap={5} aria-label={t("sections.week")}>
          <div className="flex items-center justify-end border-b border-border pb-3">
            <WeekNav
              weekStart={weekStart}
              weekEnd={weekEnd}
              locale={locale}
              labels={{ previous: tWeek("previous"), next: tWeek("next") }}
            />
          </div>
          <WeekCalendar
            days={days}
            savedOutfits={ranked}
            palettes={palettes}
            extraCandidates={extraCandidates}
            todayISO={todayISO}
            numbers={numbers}
          />
          <TodayLine
            committed={committed}
            candidates={ranked.filter(isWearable)}
            palettes={palettes}
            extraCandidates={extraCandidates}
            todayISO={todayISO}
            todayEvent={todayWorn?.event ?? null}
          />
        </Stack>
      </OutfitStudio>
    </PageContainer>
  );
}
