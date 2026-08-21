"use client";

import { useMemo, useState, useTransition } from "react";
import { unassignDayAction } from "@/app/outfits/actions";
import { UI } from "@/lib/prendas/ui-strings";
import type { SanzoPalette, SavedOutfit, WeekDayPlan } from "@/lib/outfits/types";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { OutfitCollage, OutfitTile, outfitSubtitle } from "./OutfitTile";
import { OutfitSheet } from "./OutfitSheet";
import { Card, Icon, Sheet, Text, TextButton, EmptyState } from "@/components/ui";

const WEEKDAY_LABELS = ["dl", "dt", "dc", "dj", "dv", "ds", "dg"];

function parseDay(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function longDayLabel(iso: string): string {
  return parseDay(iso).toLocaleDateString("ca", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export function WeekCalendar({
  days,
  savedOutfits,
  palettes,
  extraCandidates,
  todayISO,
}: {
  days: WeekDayPlan[];
  savedOutfits: SavedOutfit[];
  palettes: SanzoPalette[];
  extraCandidates: GarmentWithColors[];
  todayISO: string;
}) {
  const paletteMap = useMemo(() => new Map(palettes.map((p) => [p.id, p])), [palettes]);
  const [openDate, setOpenDate] = useState<string | null>(null);
  // A day that already has an outfit opens on that outfit; an empty one
  // opens on the grid. The two are alternative sheets, never nested —
  // this app's panels can't contain another sheet.
  const [picking, setPicking] = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const openDay = days.find((d) => d.date === openDate) ?? null;
  const pickedOutfit = savedOutfits.find((o) => o.id === pickedId) ?? null;

  const openCell = (day: WeekDayPlan) => {
    setOpenDate(day.date);
    setPickedId(day.outfit?.id ?? null);
    setPicking(day.outfit === null);
  };

  const close = () => {
    setOpenDate(null);
    setPicking(false);
    setPickedId(null);
  };

  const handleClear = (dayISO: string) => {
    startTransition(async () => {
      await unassignDayAction(dayISO);
      close();
    });
  };

  if (savedOutfits.length === 0) {
    return (
      <EmptyState
        title={UI.outfits.emptyNoOutfitsBrowse}
        hint={UI.outfits.emptyNoOutfitsHint}
      />
    );
  }

  return (
    <>
      {/* Always seven across. The week used to wrap two-up on a phone,
          which was right when it was a screen of its own; as the middle
          stratum of "què em poso?" that same layout became four rows of
          large squares sitting between the day's answer and the
          collection, and the secondary thing outweighed both. Seven
          small stamps read as one line of time, which is all this
          stratum has to say. Desktop keeps portrait cells — there the
          row has width to spend. */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
        {days.map((day) => (
          <DayCell
            key={day.date}
            day={day}
            isToday={day.date === todayISO}
            onOpen={() => openCell(day)}
          />
        ))}
      </div>

      {openDay && picking && (
        <DayPickerSheet
          dayISO={openDay.date}
          savedOutfits={savedOutfits}
          paletteMap={paletteMap}
          assignedOutfitId={openDay.outfit?.id ?? null}
          onPick={(id) => {
            setPickedId(id);
            setPicking(false);
          }}
          onBack={pickedId ? () => setPicking(false) : undefined}
          onClose={close}
        />
      )}

      {openDay && !picking && pickedOutfit && (
        <OutfitSheet
          outfit={pickedOutfit}
          palette={paletteMap.get(pickedOutfit.paletteId) ?? null}
          extraCandidates={extraCandidates}
          dayISO={openDay.date}
          todayISO={todayISO}
          isCommitted={openDay.outfit?.id === pickedOutfit.id}
          dayExtras={openDay.extras}
          onChangeOutfit={() => setPicking(true)}
          onClear={() => handleClear(openDay.date)}
          onClose={close}
        />
      )}
    </>
  );
}

function DayCell({
  day,
  isToday,
  onOpen,
}: {
  day: WeekDayPlan;
  isToday: boolean;
  onOpen: () => void;
}) {
  const d = parseDay(day.date);
  const weekday = WEEKDAY_LABELS[(d.getUTCDay() + 6) % 7];
  const title = day.outfit ? outfitSubtitle(day.outfit) || day.outfit.name : null;

  return (
    <Card
      as="button"
      type="button"
      interactive="clickable"
      onClick={onOpen}
      data-testid="calendar-day-cell"
    >
      {/* Stacked and centred at seven-across, back to a baseline row
          once a cell is wide enough to hold both on one line. */}
      <div className="flex flex-col items-center gap-0 pb-1 sm:flex-row sm:items-baseline sm:justify-between sm:pb-2">
        <Text variant="caption" tone={isToday ? "primary" : "secondary"}>
          {weekday}
        </Text>
        <Text variant="caption" tabular tone={isToday ? "primary" : "secondary"}>
          {String(d.getUTCDate()).padStart(2, "0")}
        </Text>
      </div>
      <div
        className={`relative aspect-square lg:aspect-[3/4] w-full overflow-hidden transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)] group-hover:-translate-y-1 group-active:translate-y-0 ${
          isToday ? "ring-1 ring-text-primary" : ""
        }`}
      >
        {day.outfit ? (
          // The whole look, clothes and what you wore them with: a day is
          // not the outfit, it is the outfit plus the shoes and
          // accessories you actually put on.
          <OutfitCollage
            garments={[...day.outfit.garments, ...day.extras]}
            max={6}
            sizes="(min-width: 1024px) 12vw, (min-width: 640px) 22vw, 45vw"
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface text-text-secondary">
            <Icon name="plus" size={16} />
          </div>
        )}
      </div>
      {/* A caption under a 42px stamp is an ellipsis, so the phone goes
          without one: the photograph already says which outfit it is. */}
      <Text
        variant="small"
        italic
        tone="secondary"
        className="font-serif lowercase mt-1.5 truncate hidden sm:block"
      >
        {title ?? UI.outfits.plan}
      </Text>
    </Card>
  );
}

function DayPickerSheet({
  dayISO,
  savedOutfits,
  paletteMap,
  assignedOutfitId,
  onPick,
  onBack,
  onClose,
}: {
  dayISO: string;
  savedOutfits: SavedOutfit[];
  paletteMap: Map<number, SanzoPalette>;
  assignedOutfitId: string | null;
  onPick: (outfitId: string) => void;
  onBack?: () => void;
  onClose: () => void;
}) {
  const label = longDayLabel(dayISO);

  return (
    <Sheet
      onClose={onClose}
      size="xl"
      label={`${UI.outfits.plan} ${label}`}
      header={
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <Text variant="caption">{UI.outfits.plan}</Text>
            {/* first-letter, not capitalize: "diumenge, 23 d'agost" must
                not become "D'agost". */}
            <h2 className="type-title first-letter:uppercase">{label}</h2>
          </div>
          {onBack && (
            <TextButton type="button" tone="secondary" onClick={onBack}>
              {UI.outfits.back}
            </TextButton>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-8">
        {savedOutfits.map((outfit, i) => (
          <OutfitTile
            key={outfit.id}
            outfit={outfit}
            palette={paletteMap.get(outfit.paletteId) ?? null}
            index={i}
            mark={outfit.id === assignedOutfitId ? UI.outfits.planned : null}
            onOpen={() => onPick(outfit.id)}
          />
        ))}
      </div>
    </Sheet>
  );
}
