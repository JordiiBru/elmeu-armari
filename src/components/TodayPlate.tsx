"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { formatLastWorn } from "@/lib/outfits/worn";
import { UI } from "@/lib/prendas/ui-strings";
import { OutfitCollage, outfitSubtitle, paletteName, pieceLabel } from "./OutfitTile";
import { PieceThumb } from "./PieceThumb";
import { OutfitSheet } from "./OutfitSheet";
import { Button, Card, EmptyState, Icon, Stack, Text, TextButton } from "@/components/ui";

/** Where the collection lives, one stratum down. */
const COLLECTION_ID = "tots-els-outfits";

function scrollToCollection() {
  document
    .getElementById(COLLECTION_ID)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * The top stratum of "què em poso?": today, and only today.
 *
 * The big plate is reserved for the outfit you have actually committed
 * to. It used to also carry a ranked proposal while the day was open,
 * and that was wrong twice over — with a handful of saved outfits the
 * ranking rarely lands, and a photograph shown large and first reads as
 * a decision, not a guess. So an undecided day gets no plate at all,
 * just the question and the way to answer it, which leaves the week
 * directly underneath as the first real thing on the screen.
 */
export function TodayPlate({
  committed,
  candidates,
  todayExtras,
  palettes,
  extraCandidates,
  todayISO,
}: {
  /** The outfit assigned to today, if the day is decided. */
  committed: SavedOutfit | null;
  /** Wearable outfits, already ranked. Only feeds the shuffle now. */
  candidates: SavedOutfit[];
  /** Shoes, socks and accessories recorded for today. They belong to the
   * day, not to the outfit, which is why they arrive separately. */
  todayExtras: GarmentWithColors[];
  palettes: SanzoPalette[];
  extraCandidates: GarmentWithColors[];
  todayISO: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  /**
   * Deciding the day changes this plate, and you are usually deep in the
   * week or the collection when you do it — so the thing that just
   * changed would be off-screen.
   *
   * It has to be owned here rather than by the sheet that commits: the
   * sheet unmounts on close, and the server action's revalidation lands
   * afterwards, at which point Next restores the scroll position and
   * undoes anything scrolled before it (measured: 0, then straight back
   * to where you were). This component survives that round trip, so an
   * effect on the committed id runs after it, not against it.
   */
  const committedId = committed?.id ?? null;
  const lastCommittedId = useRef(committedId);
  const settled = useRef(false);
  useEffect(() => {
    if (settled.current && committedId !== null && committedId !== lastCommittedId.current) {
      window.scrollTo({ top: 0 });
    }
    lastCommittedId.current = committedId;
    settled.current = true;
  }, [committedId]);

  const open = useMemo(
    () =>
      openId === null
        ? null
        : (committed?.id === openId ? committed : null) ??
          candidates.find((o) => o.id === openId) ??
          null,
    [openId, committed, candidates],
  );

  const paletteOf = (outfit: SavedOutfit) =>
    palettes.find((p) => p.id === outfit.paletteId) ?? null;

  // A dice roll, and it says so. It stopped pretending to be a ranked
  // recommendation the moment the plate stopped showing one.
  const shuffle = () => {
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    if (pick) setOpenId(pick.id);
  };

  const sheet = open && (
    <OutfitSheet
      outfit={open}
      palette={paletteOf(open)}
      extraCandidates={extraCandidates}
      dayISO={todayISO}
      todayISO={todayISO}
      isCommitted={open.id === committed?.id}
      onClose={() => setOpenId(null)}
    />
  );

  if (!committed) {
    return (
      <Stack gap={5}>
        {candidates.length === 0 ? (
          <EmptyState
            title={UI.outfits.emptyNoneReady}
            action={
              <Link
                href="/bugaderia?vista=cistell"
                className="font-serif italic type-small text-text-secondary hover:text-text-primary transition-colors duration-[var(--duration-base)]"
              >
                {UI.outfits.goToRentar}
              </Link>
            }
          />
        ) : (
          <>
            <Text as="p" italic tone="secondary" className="type-subtitle">
              {UI.outfits.todayUndecided}
            </Text>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button type="button" size="lg" onClick={scrollToCollection}>
                {UI.outfits.chooseToday}
              </Button>
              {candidates.length > 1 && (
                <TextButton type="button" onClick={shuffle}>
                  <Icon name="sparkle" size={13} className="fill-current" />
                  {UI.outfits.pickForMe}
                </TextButton>
              )}
            </div>
          </>
        )}
        {sheet}
      </Stack>
    );
  }

  const palette = paletteOf(committed);
  const title = outfitSubtitle(committed) || committed.name || "";
  const subtitle = [paletteName(palette), formatLastWorn(committed.wornEvents)]
    .filter(Boolean)
    .join(" · ");

  return (
    <Stack gap={4}>
      <Card
        as="button"
        type="button"
        interactive="clickable"
        onClick={() => setOpenId(committed.id)}
        className="max-w-3xl"
        data-testid="today-plate"
      >
        {/* Photograph and label side by side once there is room, the way
            a plate carries its caption. */}
        <div className="grid gap-4 sm:grid-cols-[minmax(0,18rem)_1fr] sm:items-center sm:gap-10">
          <div className="relative aspect-[3/4] w-full overflow-hidden transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)] group-hover:-translate-y-1 group-active:translate-y-0">
            <OutfitCollage
              garments={committed.garments}
              sizes="(min-width: 640px) 18rem, 92vw"
              className="h-full w-full"
            />
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

            {/* Beside the photograph, not inside it. Folding shoes and
                accessories into the collage turns one clean plate into a
                wall of six thumbnails; as a companion strip they are
                legible at a glance and the photograph stays the subject. */}
            {todayExtras.length > 0 && (
              <div className="mt-5 flex items-center gap-2">
                <Text variant="caption" as="span" className="mr-1">
                  {UI.outfits.wornWith}
                </Text>
                {todayExtras.map((g) => (
                  <span key={g.id} title={pieceLabel(g)} className="flex-shrink-0">
                    <PieceThumb garment={g} thumb sizes="40px" className="h-10 w-10" />
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Outside the Card: the Card is itself a button, and one button
          inside another is not valid markup. */}
      <TextButton
        type="button"
        tone="secondary"
        onClick={scrollToCollection}
        className="self-start"
      >
        {UI.outfits.changeToday}
        <Icon name="arrow-right" size={12} />
      </TextButton>

      {sheet}
    </Stack>
  );
}
