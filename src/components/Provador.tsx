"use client";

import { useState, useTransition, useMemo } from "react";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { CATEGORY_LABELS } from "@/lib/prendas/labels";
import { saveProvadorOutfitAction } from "@/app/outfits/actions";
import { CarouselRow } from "./CarouselRow";

function findIndex(items: GarmentWithColors[], id: string | undefined): number {
  if (!id) return 0;
  const i = items.findIndex((g) => g.id === id);
  return i === -1 ? 0 : i;
}

function keyOf(ids: string[]): string {
  return [...ids].sort().join("|");
}

interface Props {
  tops: GarmentWithColors[];
  bottoms: GarmentWithColors[];
  shoes: GarmentWithColors[];
  savedKeys: string[];
  initial: { top?: string; bottom?: string; shoes?: string };
}

export function Provador({ tops, bottoms, shoes, savedKeys, initial }: Props) {
  const [topIdx, setTopIdx] = useState(() => findIndex(tops, initial.top));
  const [bottomIdx, setBottomIdx] = useState(() => findIndex(bottoms, initial.bottom));
  const [shoesIdx, setShoesIdx] = useState(() => findIndex(shoes, initial.shoes));
  const [pending, startTransition] = useTransition();
  // Combinacions desades localment durant la sessio (les del servidor venen a savedKeys).
  const [localSaved, setLocalSaved] = useState<Set<string>>(new Set());

  const savedSet = useMemo(() => new Set(savedKeys), [savedKeys]);

  const currentTop = tops[topIdx];
  const currentBottom = bottoms[bottomIdx];
  const currentShoes = shoes[shoesIdx];

  const outfitIds = [currentTop?.id, currentBottom?.id, currentShoes?.id].filter(
    (x): x is string => typeof x === "string",
  );

  const currentKey = keyOf(outfitIds);
  const isSaved = outfitIds.length >= 2 && (savedSet.has(currentKey) || localSaved.has(currentKey));
  const canSave = outfitIds.length >= 2 && !pending && !isSaved;

  const handleSave = () => {
    if (!canSave) return;
    const keyToSave = currentKey;
    startTransition(async () => {
      try {
        await saveProvadorOutfitAction(outfitIds);
        setLocalSaved((prev) => new Set(prev).add(keyToSave));
      } catch {
        /* silenci — l'estat isSaved no cambia */
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div
        className="flex-1 flex flex-col min-h-0 py-4 md:py-6 gap-3 md:gap-4"
        style={{ paddingBottom: "calc(56px + env(safe-area-inset-bottom) + 16px)" }}
      >
        <Row
          items={tops}
          idx={topIdx}
          setIdx={setTopIdx}
          label="Part de dalt"
          priority
        />
        <Row items={bottoms} idx={bottomIdx} setIdx={setBottomIdx} label={CATEGORY_LABELS.PANTS} />
        <Row items={shoes} idx={shoesIdx} setIdx={setShoesIdx} label={CATEGORY_LABELS.SHOES} />
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-20 bg-background border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="group w-full h-14 flex items-center justify-center gap-4
            font-serif text-base italic text-foreground
            transition-opacity duration-200 ease-out
            active:opacity-60
            disabled:opacity-30 disabled:pointer-events-none"
          aria-live="polite"
        >
          <span aria-hidden className="h-px w-6 bg-foreground/40 transition-all duration-500 group-hover:w-10 group-hover:bg-foreground" />
          <span>
            {pending
              ? "desant"
              : isSaved
                ? "outfit desat"
                : "desar aquest outfit"}
          </span>
          <span aria-hidden className="h-px w-6 bg-foreground/40 transition-all duration-500 group-hover:w-10 group-hover:bg-foreground" />
        </button>
      </div>
    </div>
  );
}

function Row({
  items,
  idx,
  setIdx,
  label,
  priority,
}: {
  items: GarmentWithColors[];
  idx: number;
  setIdx: (i: number) => void;
  label: string;
  priority?: boolean;
}) {
  // Files buides es col·lapsen a una banda petita perque no consumeixin espai
  // vertical del viewport i deixin lloc a la resta.
  if (items.length === 0) {
    return (
      <div className="shrink-0 flex items-center justify-between gap-4 px-6 md:px-10 py-3">
        <span className="text-[10px] tracking-[0.25em] uppercase text-foreground-secondary truncate">
          {label}
        </span>
        <span className="text-[10px] tracking-[0.2em] uppercase italic text-foreground-secondary shrink-0">
          sense peces
        </span>
      </div>
    );
  }
  return (
    <div className="flex-1 min-h-0">
      <CarouselRow items={items} index={idx} onChange={setIdx} label={label} priority={priority} />
    </div>
  );
}
