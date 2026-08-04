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
  // The server round-trip (revalidatePath) eventually refreshes
  // `todayOutfitId`, but that's not instant enough to feel like a
  // response to the tap — this flips the button the moment the action
  // resolves, without waiting for the route to re-render.
  const [justWornId, setJustWornId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const effectiveTodayId = justWornId ?? todayOutfitId;
  const activeOutfit = readyOutfits[activeIndex] ?? null;
  const activeIsToday = activeOutfit?.id === effectiveTodayId;

  // Which card is centred, tracked from actual scroll position rather
  // than IntersectionObserver threshold crossings — with peeking
  // neighbours several cards can be simultaneously "intersecting" at
  // low ratios, which made the threshold-based version stick on the
  // first card. Comparing each card's centre to the viewport's centre
  // has no such ambiguity.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    const updateActive = () => {
      const viewportCenter = el.scrollLeft + el.clientWidth / 2;
      let closest = 0;
      let closestDistance = Infinity;
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const distance = Math.abs(cardCenter - viewportCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = i;
        }
      });
      setActiveIndex(closest);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateActive);
    };
    updateActive();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [readyOutfits.length]);

  const goToCard = (direction: 1 | -1) => {
    cardRefs.current[activeIndex + direction]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  };

  const handleWear = (outfit: SavedOutfit) => {
    startTransition(async () => {
      await wearOutfitTodayAction(outfit.id);
      setJustWornId(outfit.id);
      toast.show(UI.bugaderia.avui.assignedToast, "success");
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
          {readyOutfits.map((outfit, i) => {
            const palette = paletteMap.get(outfit.paletteId) ?? null;
            return (
              <div
                key={outfit.id}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                data-index={i}
                className="w-[88%] shrink-0 snap-center flex flex-col gap-3"
              >
                <div className="relative">
                  <OutfitCollage
                    garments={allGarmentsOf(outfit)}
                    thumb={false}
                    className="aspect-[3/4] w-full"
                  />
                  {/* Swiping covers touch; a mouse can't drag this
                      scroller, so pointer-capable screens get click
                      targets too. Hidden below `sm` — on a phone
                      they'd just sit on top of the swipe gesture. */}
                  {readyOutfits.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => goToCard(-1)}
                        aria-label="Outfit anterior"
                        className="hidden sm:inline-flex absolute left-2 top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center bg-elevated/90 text-text-primary transition-colors duration-[var(--duration-base)] ease-[var(--ease-standard)] hover:bg-elevated focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        <Icon name="chevron-left" size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => goToCard(1)}
                        aria-label="Outfit següent"
                        className="hidden sm:inline-flex absolute right-2 top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center bg-elevated/90 text-text-primary transition-colors duration-[var(--duration-base)] ease-[var(--ease-standard)] hover:bg-elevated focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
