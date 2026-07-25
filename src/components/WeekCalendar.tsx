"use client";

import { useMemo, useState, useTransition } from "react";
import { assignOutfitToDayAction, unassignDayAction } from "@/app/outfits/actions";
import { CATEGORY_LABELS } from "@/lib/prendas/labels";
import type { SanzoPalette, SavedOutfit, WeekDayPlan } from "@/lib/outfits/types";
import { OutfitCollage } from "./SavedOutfitsView";
import { Card, Icon, Sheet, Text, TextButton, useToast, EmptyState } from "@/components/ui";

const WEEKDAY_LABELS = ["dl", "dt", "dc", "dj", "dv", "ds", "dg"];

function parseDay(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function primaryGarmentsOf(outfit: SavedOutfit) {
  return outfit.garments.filter((g) => g.role === "primary").map((g) => g.garment);
}

export function WeekCalendar({
  days,
  savedOutfits,
  palettes,
  todayISO,
}: {
  days: WeekDayPlan[];
  savedOutfits: SavedOutfit[];
  palettes: SanzoPalette[];
  todayISO: string;
}) {
  const paletteMap = useMemo(() => new Map(palettes.map((p) => [p.id, p])), [palettes]);
  const [openDate, setOpenDate] = useState<string | null>(null);
  const openDay = days.find((d) => d.date === openDate) ?? null;

  if (savedOutfits.length === 0) {
    return (
      <EmptyState
        title="res per planificar encara."
        hint={
          <>
            desa algun outfit a <span className="text-text-primary">l&apos;armari</span> per
            poder-lo assignar a un dia.
          </>
        }
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-7 gap-4">
        {days.map((day) => (
          <DayCell
            key={day.date}
            day={day}
            isToday={day.date === todayISO}
            onOpen={() => setOpenDate(day.date)}
          />
        ))}
      </div>

      {openDay && (
        <DayPickerSheet
          day={openDay}
          savedOutfits={savedOutfits}
          paletteMap={paletteMap}
          onClose={() => setOpenDate(null)}
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
  const primaryGarments = day.outfit ? primaryGarmentsOf(day.outfit) : [];
  const title = day.outfit
    ? primaryGarments.map((g) => CATEGORY_LABELS[g.category]).join(" · ")
    : null;

  return (
    <Card
      as="button"
      type="button"
      interactive="clickable"
      onClick={onOpen}
      data-testid="calendar-day-cell"
    >
      <div className="flex items-baseline justify-between pb-2">
        <Text variant="caption" tone={isToday ? "primary" : "secondary"}>
          {weekday}
        </Text>
        <Text variant="caption" tabular tone={isToday ? "primary" : "secondary"}>
          {String(d.getUTCDate()).padStart(2, "0")}
        </Text>
      </div>
      <div
        className={`relative aspect-square w-full overflow-hidden transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)] group-hover:-translate-y-1 group-active:translate-y-0 ${
          isToday ? "ring-1 ring-text-primary" : ""
        }`}
      >
        {day.outfit ? (
          <OutfitCollage garments={primaryGarments} className="h-full w-full" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface text-text-secondary">
            <Icon name="plus" size={16} />
          </div>
        )}
      </div>
      <Text variant="small" italic tone="secondary" className="font-serif mt-1.5 truncate">
        {title ?? "planificar"}
      </Text>
    </Card>
  );
}

function DayPickerSheet({
  day,
  savedOutfits,
  paletteMap,
  onClose,
}: {
  day: WeekDayPlan;
  savedOutfits: SavedOutfit[];
  paletteMap: Map<number, SanzoPalette>;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const label = parseDay(day.date).toLocaleDateString("ca", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  const handleAssign = (outfitId: string) => {
    startTransition(async () => {
      await assignOutfitToDayAction(outfitId, day.date);
      toast.show("outfit assignat", "success");
      onClose();
    });
  };

  const handleClear = () => {
    startTransition(async () => {
      await unassignDayAction(day.date);
      toast.show("dia buidat");
      onClose();
    });
  };

  return (
    <Sheet
      onClose={onClose}
      size="md"
      label={`Planificar ${label}`}
      header={
        <div className="flex flex-col gap-1">
          <Text variant="caption">planificar</Text>
          <h2 className="type-title capitalize">{label}</h2>
        </div>
      }
    >
      {day.outfit && (
        <div className="flex items-center justify-between border-b border-border pb-4">
          <Text variant="small" italic tone="secondary" className="font-serif">
            ara portes {primaryGarmentsOf(day.outfit).map((g) => CATEGORY_LABELS[g.category]).join(" · ")}
          </Text>
          <TextButton type="button" tone="danger" onClick={handleClear} disabled={pending}>
            treure
          </TextButton>
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {savedOutfits.map((outfit) => {
          const isAssigned = day.outfit?.id === outfit.id;
          return (
            <button
              key={outfit.id}
              type="button"
              onClick={() => handleAssign(outfit.id)}
              disabled={pending}
              aria-pressed={isAssigned}
              className={`flex flex-col gap-1 p-1 border transition-colors text-left ${
                isAssigned
                  ? "border-text-primary bg-elevated"
                  : "border-border hover:border-text-secondary"
              }`}
            >
              <OutfitCollage garments={primaryGarmentsOf(outfit)} className="aspect-[3/4] w-full" />
              <Text variant="small" tone="secondary" className="font-serif leading-tight truncate">
                {paletteMap.get(outfit.paletteId)?.nombre ?? outfit.name ?? "outfit"}
              </Text>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
