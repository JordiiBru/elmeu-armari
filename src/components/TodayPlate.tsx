"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { isWearable } from "@/lib/bugaderia/laundry";
import { formatLastWorn } from "@/lib/outfits/worn";
import { UI } from "@/lib/prendas/ui-strings";
import { OutfitCollage, outfitSubtitle, paletteName } from "./OutfitTile";
import { OutfitSheet } from "./OutfitSheet";
import { Card, EmptyState, Icon, Stack, Text, TextButton } from "@/components/ui";

/**
 * The day's answer, as one plate. Top stratum of "què em poso?".
 *
 * It shows the outfit already committed to today, or — while today is
 * still undecided — the app's proposal, which is simply the first of the
 * ranked wearable ones. Opening it opens the same `OutfitSheet` the grid
 * below opens: the plate is a shortcut into the collection, never a
 * second way of committing a day.
 *
 * Deliberately not a full-bleed hero: a photograph with its label
 * beside it, capped short of the page width, so it reads as a plate laid
 * on the page rather than a banner — and so the week underneath still
 * shows on a phone.
 */
export function TodayPlate({
  committed,
  candidates,
  palettes,
  extraCandidates,
  todayISO,
}: {
  /** The outfit already assigned to today, if the day is decided. */
  committed: SavedOutfit | null;
  /** Wearable outfits, already ranked: in season first, least recently
   * worn first. `candidates[0]` is therefore the proposal. */
  candidates: SavedOutfit[];
  palettes: SanzoPalette[];
  extraCandidates: GarmentWithColors[];
  todayISO: string;
}) {
  const [open, setOpen] = useState(false);
  const [proposedId, setProposedId] = useState<string | null>(
    () => candidates[0]?.id ?? null,
  );

  const outfit =
    committed ?? candidates.find((o) => o.id === proposedId) ?? candidates[0] ?? null;

  const palette = useMemo(
    () => (outfit ? (palettes.find((p) => p.id === outfit.paletteId) ?? null) : null),
    [palettes, outfit],
  );

  // Anything but the one on the plate, weighted towards what you have not
  // worn in a while — the ranking already put those first, so drawing
  // from the head of the list is enough.
  const shuffle = () => {
    const pool = candidates
      .slice(0, Math.max(3, Math.ceil(candidates.length / 2)))
      .filter((o) => o.id !== outfit?.id);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) setProposedId(pick.id);
  };

  if (!outfit) {
    return (
      <EmptyState
        title={UI.outfits.emptyNoneReady}
        action={
          <Link
            href="/bugaderia"
            className="font-serif italic type-small text-text-secondary hover:text-text-primary transition-colors duration-[var(--duration-base)]"
          >
            {UI.outfits.goToRentar}
          </Link>
        }
      />
    );
  }

  const isCommitted = committed !== null;
  const title = outfitSubtitle(outfit) || outfit.name || "";
  const subtitle = [paletteName(palette), formatLastWorn(outfit.wornEvents)]
    .filter(Boolean)
    .join(" · ");

  return (
    <Stack gap={4}>
      <div className="flex items-baseline justify-between gap-4">
        <Text variant="caption">
          {isCommitted ? UI.outfits.todayWearing : UI.outfits.todayProposal}
        </Text>
        {/* Shuffling only makes sense while the day is still open, and
            only when there is something else it could land on. */}
        {!isCommitted && candidates.length > 1 && (
          <TextButton type="button" onClick={shuffle} className="inline-flex items-center gap-1.5">
            <Icon name="sparkle" size={13} className="fill-current" />
            {UI.outfits.pickForMe}
          </TextButton>
        )}
      </div>

      <Card
        as="button"
        type="button"
        interactive="clickable"
        onClick={() => setOpen(true)}
        className="max-w-3xl"
        data-testid="today-plate"
      >
        {/* Photograph and label side by side once there is room, the way
            a plate carries its caption. Stacked under the photograph the
            plate used a third of a desktop and left the rest blank,
            which reads as unfinished rather than as air. */}
        <div className="grid gap-4 sm:grid-cols-[minmax(0,18rem)_1fr] sm:items-center sm:gap-10">
          <div className="relative aspect-[3/4] w-full overflow-hidden transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)] group-hover:-translate-y-1 group-active:translate-y-0">
            <OutfitCollage
              garments={outfit.garments}
              sizes="(min-width: 640px) 18rem, 92vw"
              className="h-full w-full"
            />
            {!isWearable(outfit) && (
              <span className="absolute bottom-2 left-2 type-caption whitespace-nowrap bg-elevated px-1.5 py-0.5">
                {UI.outfits.inBasket}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <h2 className="font-serif type-title-xl lowercase leading-tight">{title}</h2>
            <Text variant="small" italic tone="secondary" className="font-serif mt-2">
              {subtitle}
            </Text>
            {palette && (
              <div aria-hidden className="mt-4 flex h-1 w-full max-w-64 overflow-hidden">
                {palette.colores.map((hex, i) => (
                  <span key={i} className="flex-1" style={{ backgroundColor: hex }} />
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Without this the plate read as the only thing on offer: the
          collection is three screens down and its heading was never seen.
          An anchor, so it works before hydration and leaves the URL at
          the section you jumped to. */}
      <a
        href="#tots-els-outfits"
        className="inline-flex items-center gap-1.5 self-start font-serif italic type-small text-text-secondary hover:text-text-primary transition-colors duration-[var(--duration-base)]"
      >
        {UI.outfits.seeAll}
        <Icon name="arrow-right" size={12} />
      </a>

      {open && (
        <OutfitSheet
          outfit={outfit}
          palette={palette}
          extraCandidates={extraCandidates}
          dayISO={todayISO}
          todayISO={todayISO}
          isCommitted={isCommitted}
          onClose={() => setOpen(false)}
        />
      )}
    </Stack>
  );
}
