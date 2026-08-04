"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { wearOutfitTodayAction } from "@/app/bugaderia/actions";
import { CATEGORY_LABELS } from "@/lib/prendas/labels";
import { UI } from "@/lib/prendas/ui-strings";
import type { SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { formatLastWorn } from "@/lib/outfits/worn";
import { OutfitCollage, allGarmentsOf } from "./SavedOutfitsView";
import { Button, Icon, Text, EmptyState, useToast } from "@/components/ui";

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
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [almostOpen, setAlmostOpen] = useState(false);
  const [wearingId, setWearingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const scrollByCard = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth, behavior: "smooth" });
  };

  const handleWear = (outfit: SavedOutfit) => {
    setWearingId(outfit.id);
    startTransition(async () => {
      const { dirtied } = await wearOutfitTodayAction(outfit.id);
      toast.show(UI.bugaderia.avui.dirtiedToast(dirtied), "success");
      setWearingId(null);
    });
  };

  if (readyOutfits.length === 0) {
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
    <div className="flex flex-col gap-8">
      {todayOutfitId && (
        <Text variant="small" italic tone="secondary" className="font-serif">
          {UI.bugaderia.avui.alreadyToday}
        </Text>
      )}

      <div className="relative">
        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory overflow-x-auto gap-6 scroll-smooth"
          tabIndex={0}
        >
          {readyOutfits.map((outfit) => {
            const isToday = outfit.id === todayOutfitId;
            const palette = paletteMap.get(outfit.paletteId) ?? null;
            return (
              <div key={outfit.id} className="w-full shrink-0 snap-center flex flex-col gap-4">
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
                      {palette.colores.map((color, i) => (
                        <span key={i} className="inline-block h-3 w-6" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  )}
                  <Text variant="small" italic tone="secondary" className="font-serif">
                    {formatLastWorn(outfit.wornEvents)}
                  </Text>
                </div>
                {isToday ? (
                  <Text variant="small" italic tone="secondary" className="font-serif">
                    {UI.bugaderia.avui.wornToday}
                  </Text>
                ) : (
                  <Button
                    type="button"
                    size="lg"
                    onClick={() => handleWear(outfit)}
                    disabled={isPending}
                    loading={wearingId === outfit.id}
                    loadingText="assignant…"
                  >
                    {UI.bugaderia.avui.wearIt}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {readyOutfits.length > 1 && (
          <div className="flex items-center justify-center gap-6 pt-4">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              aria-label="Outfit anterior"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <Icon name="chevron-left" size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              aria-label="Outfit següent"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <Icon name="chevron-right" size={18} />
            </button>
          </div>
        )}
      </div>

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
