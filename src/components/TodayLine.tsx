"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { DayEvent, SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { OutfitSheet } from "./OutfitSheet";
import { DayPhotoInput } from "./DayPhotoInput";
import { EmptyState, Icon, Stack, TextButton } from "@/components/ui";

/**
 * What is left to do about today, under the week that already shows it.
 *
 * This is all that survives of the old plate. A photograph of the day's
 * outfit shown large and first was the app's biggest surface spent
 * repeating the cell directly below it, and it pushed the calendar — the
 * thing that actually holds the week — under the fold. Today is marked in
 * the calendar and opens from there; what cannot live in a 45px cell is
 * the one action the day still wants, and that is what this line is.
 *
 * It says one thing at a time, in the order the morning happens: decide
 * the outfit, then, if you feel like it, photograph yourself in it.
 */
export function TodayLine({
  committed,
  candidates,
  palettes,
  extraCandidates,
  todayISO,
  todayEvent,
}: {
  /** The outfit assigned to today, if the day is decided. */
  committed: SavedOutfit | null;
  /** Wearable outfits, already ranked. Only feeds the shuffle. */
  candidates: SavedOutfit[];
  palettes: SanzoPalette[];
  extraCandidates: GarmentWithColors[];
  todayISO: string;
  /** Today's committed day, which is what a photo belongs to. */
  todayEvent: DayEvent | null;
}) {
  const t = useTranslations("outfits");
  const [openId, setOpenId] = useState<string | null>(null);

  const open = candidates.find((o) => o.id === openId) ?? null;

  // A dice roll, and it says so. It never pretended to be a ranked
  // recommendation, which is exactly why it survived the plate.
  const shuffle = () => {
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    if (pick) setOpenId(pick.id);
  };

  const sheet = open && (
    <OutfitSheet
      outfit={open}
      palette={palettes.find((p) => p.id === open.paletteId) ?? null}
      extraCandidates={extraCandidates}
      dayISO={todayISO}
      todayISO={todayISO}
      onClose={() => setOpenId(null)}
    />
  );

  if (!committed) {
    if (candidates.length === 0) {
      return (
        <EmptyState
          title={t("emptyNoneReady")}
          action={
            <Link
              href="/bugaderia?vista=cistell"
              className="font-serif italic type-small text-text-secondary hover:text-text-primary transition-colors duration-[var(--duration-base)]"
            >
              {t("goToRentar")}
            </Link>
          }
        />
      );
    }
    return (
      <Stack gap={4}>
        {candidates.length > 1 && (
          <TextButton type="button" onClick={shuffle} className="self-start">
            <Icon name="sparkle" size={13} className="fill-current" />
            {t("pickForMe")}
          </TextButton>
        )}
        {sheet}
      </Stack>
    );
  }

  // Decided, and not photographed yet. Once there is a photo the line has
  // nothing left to say: the picture is in the week, where it belongs.
  if (todayEvent && !todayEvent.image) {
    return <DayPhotoInput eventId={todayEvent.id} hasPhoto={false} variant="strip" />;
  }

  return null;
}
