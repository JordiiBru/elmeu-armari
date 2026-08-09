"use client";

import { useMemo, useState, useTransition } from "react";
import { wearImprovisedTodayAction } from "@/app/bugaderia/actions";
import { garmentPaletteIds, resolvePaletteForOutfit } from "@/lib/outfits/engine";
import { GarmentRow } from "./GarmentRow";
import { AvuiView } from "./AvuiView";
import { UI } from "@/lib/prendas/ui-strings";
import type { RowCategory } from "@/lib/bugaderia/rows";
import type { GarmentWithColors } from "@/lib/prendas/types";
import type { SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import { Button, Checkbox, Heading, SegmentedControl, Text, useToast } from "@/components/ui";

interface AlmostEntry {
  outfit: SavedOutfit;
  blockedBy: GarmentWithColors[];
}

type Tab = "munta" | "desats";
type Selection = Partial<Record<RowCategory, GarmentWithColors>>;

const ALL_ROWS: RowCategory[] = ["SHIRT", "PANTS", "SHOES", "SWEATER"];
const FIXED_ROWS: RowCategory[] = ["SHIRT", "PANTS", "SHOES"];

/**
 * Fixed layering the reorder-on-settle follows (not the same as the dot
 * hint below, which is symmetric across whatever's currently picked
 * elsewhere): trousers anchor on the shirt, sweater and shoes both anchor
 * on shirt + trousers. Shirt itself has nothing upstream.
 */
function anchorGarments(category: RowCategory, selection: Selection): GarmentWithColors[] {
  switch (category) {
    case "SHIRT":
      return [];
    case "PANTS":
      return [selection.SHIRT].filter((g): g is GarmentWithColors => !!g);
    case "SWEATER":
    case "SHOES":
      return [selection.SHIRT, selection.PANTS].filter((g): g is GarmentWithColors => !!g);
  }
}

function intersectPaletteIds(
  garments: GarmentWithColors[],
  paletteIdsByGarment: Map<string, Set<number>>,
): Set<number> | null {
  const sets = garments
    .map((g) => paletteIdsByGarment.get(g.id))
    .filter((s): s is Set<number> => !!s);
  if (sets.length === 0) return null;
  return sets.reduce((acc, s) => new Set([...acc].filter((id) => s.has(id))));
}

/** Compatible garments float first, keeping their relative (least-
 * recently-worn) order within each group — a stable partition, not a
 * hard filter. Silent (original order) when there's no anchor yet. */
function sortByCompatibility(
  garments: GarmentWithColors[],
  anchor: Set<number> | null,
  paletteIdsByGarment: Map<string, Set<number>>,
): GarmentWithColors[] {
  if (!anchor) return garments;
  const isCompatible = (g: GarmentWithColors) => {
    const ids = paletteIdsByGarment.get(g.id);
    return !!ids && [...ids].some((id) => anchor.has(id));
  };
  return [...garments.filter(isCompatible), ...garments.filter((g) => !isCompatible(g))];
}

/**
 * Top of `/bugaderia/avui`: a SegmentedControl switches between the row
 * builder ("Munta'l") and the existing saved-outfits carousel ("Desats",
 * unchanged `AvuiView`). Bypasses `PageContainer` — its vertical padding
 * fights the builder's "always fits, no scroll" requirement — and
 * reproduces just its horizontal rhythm here.
 */
export function AvuiBuilder({
  rows,
  defaultSweater,
  readyOutfits,
  almostOutfits,
  palettes,
  todayOutfitId,
  hasAnyOutfits,
}: {
  rows: Record<RowCategory, GarmentWithColors[]>;
  defaultSweater: boolean;
  readyOutfits: SavedOutfit[];
  almostOutfits: AlmostEntry[];
  palettes: SanzoPalette[];
  todayOutfitId: string | null;
  hasAnyOutfits: boolean;
}) {
  const [tab, setTab] = useState<Tab>("munta");
  const [withSweater, setWithSweater] = useState(defaultSweater);
  const [selection, setSelection] = useState<Selection>({});
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const activeRows = useMemo<RowCategory[]>(
    () => (withSweater ? [...FIXED_ROWS, "SWEATER"] : FIXED_ROWS),
    [withSweater],
  );

  // Sanzo palette ids per garment, over the whole catalogue regardless of
  // category — shoes included (see engine.ts `garmentPaletteIds`), unlike
  // outfit generation which still excludes them via `buildContext`.
  const paletteIdsByGarment = useMemo(() => {
    const map = new Map<string, Set<number>>();
    for (const category of ALL_ROWS) {
      for (const garment of rows[category]) {
        const ids = garmentPaletteIds(garment);
        if (ids) map.set(garment.id, ids);
      }
    }
    return map;
  }, [rows]);

  // Cross-row hints: never filters, only marks and reorders. Recomputed
  // whenever any row settles on a new pick — cheap at wardrobe scale.
  const sortedRows = useMemo(() => {
    const result = {} as Record<RowCategory, GarmentWithColors[]>;
    for (const category of ALL_ROWS) {
      const anchor = intersectPaletteIds(anchorGarments(category, selection), paletteIdsByGarment);
      result[category] = sortByCompatibility(rows[category], anchor, paletteIdsByGarment);
    }
    return result;
  }, [rows, selection, paletteIdsByGarment]);

  const compatibleIdsByRow = useMemo(() => {
    const result = {} as Record<RowCategory, Set<string>>;
    for (const category of activeRows) {
      const others = activeRows
        .filter((c) => c !== category)
        .map((c) => selection[c])
        .filter((g): g is GarmentWithColors => !!g);
      const combined = intersectPaletteIds(others, paletteIdsByGarment);
      result[category] = combined
        ? new Set(
            sortedRows[category]
              .filter((g) => {
                const ids = paletteIdsByGarment.get(g.id);
                return !!ids && [...ids].some((id) => combined.has(id));
              })
              .map((g) => g.id),
          )
        : new Set<string>();
    }
    return result;
  }, [activeRows, selection, sortedRows, paletteIdsByGarment]);

  const selectedGarments = activeRows
    .map((category) => selection[category])
    .filter((g): g is GarmentWithColors => !!g);
  const canWear = selectedGarments.length === activeRows.length;

  const resolvedPaletteId = canWear ? resolvePaletteForOutfit(selectedGarments, palettes) : null;
  const resolvedPalette = resolvedPaletteId !== null
    ? (palettes.find((p) => p.id === resolvedPaletteId) ?? null)
    : null;

  const handleWear = () => {
    if (!canWear) return;
    const garmentIds = selectedGarments.map((g) => g.id);
    startTransition(async () => {
      await wearImprovisedTodayAction(garmentIds);
      toast.show(UI.bugaderia.avui.wornToday, "success");
    });
  };

  return (
    <div className="flex h-[100dvh] flex-col gap-4 px-6 md:px-10 pt-2 pb-6 sm:mx-auto sm:w-full sm:max-w-lg sm:max-h-[820px]">
      <header className="flex flex-col gap-3 shrink-0">
        <Heading level="title-xl">{UI.bugaderia.today}</Heading>
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          ariaLabel={UI.bugaderia.today}
          options={[
            { value: "munta", label: UI.bugaderia.avui.tabs.munta },
            { value: "desats", label: UI.bugaderia.avui.tabs.desats },
          ]}
        />
      </header>

      {tab === "munta" ? (
        <>
          <div className="flex flex-1 min-h-0 flex-col gap-2">
            {activeRows.map((category) => (
              <GarmentRow
                key={category}
                category={category}
                garments={sortedRows[category]}
                compatibleIds={compatibleIdsByRow[category]}
                onSelectionChange={(garment) =>
                  setSelection((prev) => ({ ...prev, [category]: garment ?? undefined }))
                }
                className="flex-1 min-h-0"
              />
            ))}
          </div>
          <Checkbox
            className="shrink-0"
            label={UI.bugaderia.avui.withSweater}
            checked={withSweater}
            onChange={(e) => setWithSweater(e.target.checked)}
          />
          {resolvedPalette && (
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex gap-1">
                {resolvedPalette.colores.map((color, i) => (
                  <span key={i} className="inline-block h-3 w-6" style={{ backgroundColor: color }} />
                ))}
              </div>
              <Text variant="small" italic tone="secondary" className="font-serif">
                {resolvedPalette.nombre}
              </Text>
            </div>
          )}
          <Button
            type="button"
            size="lg"
            className="w-full shrink-0"
            onClick={handleWear}
            disabled={!canWear || isPending}
            loading={isPending}
            loadingText="assignant…"
          >
            {UI.bugaderia.avui.wearIt}
          </Button>
        </>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <AvuiView
            readyOutfits={readyOutfits}
            almostOutfits={almostOutfits}
            palettes={palettes}
            todayOutfitId={todayOutfitId}
            hasAnyOutfits={hasAnyOutfits}
          />
        </div>
      )}
    </div>
  );
}
