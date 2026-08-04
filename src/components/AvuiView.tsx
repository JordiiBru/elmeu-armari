"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { wearOutfitTodayAction } from "@/app/bugaderia/actions";
import { CATEGORY_LABELS } from "@/lib/prendas/labels";
import { UI } from "@/lib/prendas/ui-strings";
import type { SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import type { GarmentWithColors } from "@/lib/prendas/types";
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
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [almostOpen, setAlmostOpen] = useState(false);
  const [wearingId, setWearingId] = useState<string | null>(null);
  // The server round-trip (revalidatePath) eventually refreshes
  // `todayOutfitId`, but that's not instant enough to feel like a
  // response to the tap — this flips the card the moment the action
  // resolves, without waiting for the route to re-render.
  const [justWornId, setJustWornId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const effectiveTodayId = justWornId ?? todayOutfitId;

  // Tracks which card is centred in the viewport so the dots and the
  // arrows agree on "current" without re-deriving it from scroll math.
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root || readyOutfits.length < 2) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveIndex(Number((visible.target as HTMLElement).dataset.index));
      },
      { root, threshold: 0.6 },
    );
    cardRefs.current.forEach((card) => card && observer.observe(card));
    return () => observer.disconnect();
  }, [readyOutfits.length]);

  const scrollByCard = (direction: 1 | -1) => {
    cardRefs.current[activeIndex + direction]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  };

  const handleWear = (outfit: SavedOutfit) => {
    setWearingId(outfit.id);
    startTransition(async () => {
      const { dirtied } = await wearOutfitTodayAction(outfit.id);
      setJustWornId(outfit.id);
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
          {readyOutfits.map((outfit, i) => {
            const isToday = outfit.id === effectiveTodayId;
            const palette = paletteMap.get(outfit.paletteId) ?? null;
            return (
              <div
                key={outfit.id}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                data-index={i}
                className="w-[88%] shrink-0 snap-center flex flex-col gap-4"
              >
                <div className="relative">
                  <OutfitCollage
                    garments={allGarmentsOf(outfit)}
                    thumb={false}
                    className="aspect-[3/4] w-full"
                  />
                  {readyOutfits.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => scrollByCard(-1)}
                        aria-label="Outfit anterior"
                        className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center bg-elevated/90 text-text-primary transition-colors duration-[var(--duration-base)] ease-[var(--ease-standard)] hover:bg-elevated focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        <Icon name="chevron-left" size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollByCard(1)}
                        aria-label="Outfit següent"
                        className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center bg-elevated/90 text-text-primary transition-colors duration-[var(--duration-base)] ease-[var(--ease-standard)] hover:bg-elevated focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        <Icon name="chevron-right" size={18} />
                      </button>
                    </>
                  )}
                </div>
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
                {isToday ? (
                  <Button type="button" size="lg" variant="secondary" disabled className="gap-2">
                    <Icon name="check" size={16} />
                    {UI.bugaderia.avui.wornToday}
                  </Button>
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
          <div className="flex items-center justify-center gap-2" role="tablist" aria-label="Outfits">
            {readyOutfits.map((_, i) => (
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
