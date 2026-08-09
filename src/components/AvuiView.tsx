"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { wearOutfitTodayAction } from "@/app/bugaderia/actions";
import { CATEGORY_LABELS } from "@/lib/prendas/labels";
import { UI } from "@/lib/prendas/ui-strings";
import type { SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import { paletteOf } from "@/lib/outfits/worn";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { useCenteredIndex } from "@/lib/useCenteredIndex";
import { OutfitCollage, allGarmentsOf } from "./SavedOutfitsView";
import { Button, Icon, Text, EmptyState } from "@/components/ui";

function titleOf(outfit: SavedOutfit): string {
  return outfit.garments
    .filter((g) => g.role === "primary")
    .map((g) => CATEGORY_LABELS[g.garment.category])
    .join(" · ");
}

interface AlmostEntry {
  outfit: SavedOutfit;
  blockedBy: GarmentWithColors[];
}

export function AvuiView({
  readyOutfits,
  almostOutfits,
  palettes,
  todayOutfitId,
  hasAnyOutfits,
}: {
  readyOutfits: SavedOutfit[];
  almostOutfits: AlmostEntry[];
  palettes: SanzoPalette[];
  todayOutfitId: string | null;
  hasAnyOutfits: boolean;
}) {
  const paletteMap = new Map(palettes.map((p) => [p.id, p]));
  // Wearing an outfit re-ranks it to "just worn" (least-recently-worn
  // sorts it last), and the server round-trip would deliver that new
  // order mid-session — the card the user is looking at would jump to
  // the end under their thumb. Freezing the order on mount and only
  // ever reflecting state changes (via `justWornId` below) keeps
  // browsing stable; a fresh visit still picks up the real order.
  const [orderedOutfits] = useState(readyOutfits);
  const { scrollerRef, activeIndex, setItemRef } = useCenteredIndex(orderedOutfits.length);
  const [almostOpen, setAlmostOpen] = useState(false);
  // The server round-trip (revalidatePath) eventually refreshes
  // `todayOutfitId`, but that's not instant enough to feel like a
  // response to the tap — this flips the button the moment the action
  // resolves, without waiting for the route to re-render.
  const [justWornId, setJustWornId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const effectiveTodayId = justWornId ?? todayOutfitId;
  const activeOutfit = orderedOutfits[activeIndex] ?? null;
  const activeIsToday = activeOutfit?.id === effectiveTodayId;

  const handleWear = (outfit: SavedOutfit) => {
    startTransition(async () => {
      await wearOutfitTodayAction(outfit.id);
      setJustWornId(outfit.id);
    });
  };

  if (orderedOutfits.length === 0) {
    return (
      <EmptyState
        title={hasAnyOutfits ? UI.bugaderia.avui.emptyNoneReady : UI.bugaderia.avui.emptyNoOutfits}
        action={
          <Link
            href={hasAnyOutfits ? "/bugaderia/rentar" : "/armari"}
            className="font-serif italic type-small text-text-secondary hover:text-text-primary transition-colors"
          >
            {hasAnyOutfits ? UI.bugaderia.avui.goToRentar : UI.bugaderia.avui.goToArmari}
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {effectiveTodayId && (
        <Text variant="small" italic tone="secondary" className="font-serif">
          {UI.bugaderia.avui.alreadyToday}
        </Text>
      )}

      <div className="flex flex-col gap-3">
        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory overflow-x-auto gap-4 scroll-smooth"
          tabIndex={0}
        >
          {orderedOutfits.map((outfit, i) => {
            const palette = paletteOf(outfit, paletteMap);
            return (
              <div
                key={outfit.id}
                ref={setItemRef(i)}
                data-index={i}
                className="w-[70%] shrink-0 snap-center flex flex-col gap-3"
              >
                <OutfitCollage
                  garments={allGarmentsOf(outfit)}
                  thumb={false}
                  className="aspect-[3/4] w-full"
                />
                <div className="flex flex-col gap-1">
                  <Text as="span" className="font-serif type-title leading-tight">
                    {titleOf(outfit) || palette?.nombre || "outfit"}
                  </Text>
                  {palette && (
                    <div className="flex gap-1">
                      {palette.colores.map((color, colorIndex) => (
                        <span
                          key={colorIndex}
                          className="inline-block h-3 w-6"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {orderedOutfits.length > 1 && (
          <div className="flex items-center justify-center gap-2" role="tablist" aria-label="Outfits">
            {orderedOutfits.map((_, i) => (
              <span
                key={i}
                aria-hidden
                className={`h-1.5 w-1.5 rounded-full transition-colors duration-[var(--duration-base)] ease-[var(--ease-standard)] ${
                  i === activeIndex ? "bg-text-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* One action for the centred card, not one per card: with cards
          peeking at 88% width a button matching each card's width read
          as off-centre except on the middle ones. A single, full-width
          button that follows the active card stays centred always. */}
      {activeOutfit &&
        (activeIsToday ? (
          <Button type="button" size="lg" variant="secondary" disabled className="w-full gap-2">
            <Icon name="check" size={16} />
            {UI.bugaderia.avui.wornToday}
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={() => handleWear(activeOutfit)}
            disabled={isPending}
            loading={isPending}
            loadingText="assignant…"
          >
            {UI.bugaderia.avui.wearIt}
          </Button>
        ))}

      {almostOutfits.length > 0 && (
        <div className="flex flex-col gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => setAlmostOpen((v) => !v)}
            className="group inline-flex items-baseline gap-2 self-start type-caption hover:text-text-primary transition-colors"
            aria-expanded={almostOpen}
          >
            <span>{UI.bugaderia.avui.almost}</span>
            <span
              className={`inline-flex transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)] ${
                almostOpen ? "rotate-180" : ""
              }`}
            >
              <Icon name="chevron-down" size={12} />
            </span>
          </button>

          <div className="collapse-panel" data-open={almostOpen}>
            <div className="flex flex-col gap-4 pt-2">
              {almostOutfits.map(({ outfit, blockedBy }) => (
                <div key={outfit.id} className="flex items-center gap-4">
                  <OutfitCollage garments={allGarmentsOf(outfit)} className="h-16 w-16 flex-shrink-0" />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <Text as="span" className="font-serif truncate">
                      {titleOf(outfit)}
                    </Text>
                    <Text variant="small" italic tone="secondary" className="font-serif">
                      {UI.bugaderia.avui.almostMissing(
                        blockedBy.map((g) => CATEGORY_LABELS[g.category]).join(", "),
                      )}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
