"use client";

import { useMemo, useState, useTransition } from "react";
import { wearImprovisedTodayAction } from "@/app/bugaderia/actions";
import { garmentPaletteIds, resolvePaletteForOutfit } from "@/lib/outfits/engine";
import { GarmentRow } from "./GarmentRow";
import { AvuiView } from "./AvuiView";
import { UI } from "@/lib/prendas/ui-strings";
import { CATEGORY_LABELS } from "@/lib/prendas/labels";
import type { RowCategory } from "@/lib/bugaderia/rows";
import type { GarmentWithColors } from "@/lib/prendas/types";
import type { SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import {
  Button,
  Checkbox,
  Heading,
  Icon,
  SegmentedControl,
  Text,
  TextButton,
} from "@/components/ui";

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
  hasDirtyByRow,
  defaultSweater,
  readyOutfits,
  almostOutfits,
  palettes,
  todayOutfitId,
  hasAnyOutfits,
}: {
  rows: Record<RowCategory, GarmentWithColors[]>;
  hasDirtyByRow: Record<RowCategory, boolean>;
  defaultSweater: boolean;
  readyOutfits: SavedOutfit[];
  almostOutfits: AlmostEntry[];
  palettes: SanzoPalette[];
  todayOutfitId: string | null;
  hasAnyOutfits: boolean;
}) {
  const [tab, setTab] = useState<Tab>("munta");
  const [withSweater, setWithSweater] = useState(defaultSweater);
  // Seeded with each row's first card so the very first paint already
  // shows the real, enabled state. Left empty, the server rendered a
  // disabled button under "et falta triar: …" that flashed on every load
  // until hydration let the rows report what was centred all along. The
  // rows correct this on mount if a re-sort moved their first card.
  const [selection, setSelection] = useState<Selection>(() => {
    const initial: Selection = {};
    for (const category of ALL_ROWS) {
      const first = rows[category][0];
      if (first) initial[category] = first;
    }
    return initial;
  });
  const [isPending, startTransition] = useTransition();
  // The revalidatePath round-trip eventually refreshes the page, but not
  // fast enough to read as a response to the tap — this confirms the wear
  // immediately, the same trick AvuiView uses for saved outfits. Keyed by
  // the worn combination rather than a bare flag, so changing any row
  // drops back to "Me'l poso" instead of claiming you already wear it.
  const [wornKey, setWornKey] = useState<string | null>(null);

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
  const missingRows = activeRows.filter((category) => !selection[category]);
  const canWear = missingRows.length === 0;
  const selectionKey = selectedGarments.map((g) => g.id).join(",");
  const isWorn = canWear && wornKey === selectionKey;

  // The engine walks every garment colour against 157 canonicals, so this
  // stays out of the render path unless the actual picks change.
  const resolvedPalette = useMemo(() => {
    if (!canWear) return null;
    const id = resolvePaletteForOutfit(selectedGarments, palettes);
    return id === null ? null : (palettes.find((p) => p.id === id) ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canWear, palettes, selectionKey]);

  const handleWear = () => {
    if (!canWear) return;
    const garmentIds = selectedGarments.map((g) => g.id);
    startTransition(async () => {
      await wearImprovisedTodayAction(garmentIds);
      setWornKey(garmentIds.join(","));
    });
  };

  /* Two layout modes, because the tabs want opposite things. The builder
     must fit the viewport exactly (`flex-1 min-h-0` — never `h-[100dvh]`,
     which would stack under the site header and reintroduce the very
     scroll this screen must not have). The saved-outfit list is a list:
     it scrolls the page like every other route. Forcing it into the
     builder's fixed box left the page scrolling *and* an inner scroller
     inside it, which on a phone reads as the screen fighting your thumb. */
  const isBuilder = tab === "munta";

  return (
    <div
      className={`flex flex-col gap-3 px-6 md:px-10 pt-2 sm:mx-auto sm:w-full sm:max-w-lg ${
        isBuilder ? "flex-1 min-h-0 pb-4 sm:max-h-[820px]" : "pb-24"
      }`}
    >
      {/* `title`, not `title-xl`: on a 375px screen the larger serif ate
          roughly a card's worth of height off every row, and this screen
          is one where the clothes matter more than the masthead. */}
      <header className="flex flex-col gap-2 shrink-0">
        <Heading level="title">{UI.bugaderia.today}</Heading>
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

      {isBuilder ? (
        <>
          <div className="flex flex-1 min-h-0 flex-col gap-2">
            {activeRows.map((category) => (
              <GarmentRow
                key={category}
                category={category}
                garments={sortedRows[category]}
                compatibleIds={compatibleIdsByRow[category]}
                hasDirty={hasDirtyByRow[category]}
                onSelectionChange={(garment) =>
                  setSelection((prev) => ({ ...prev, [category]: garment ?? undefined }))
                }
                className="flex-1 min-h-0"
              />
            ))}
          </div>
          <div className="flex shrink-0 items-center justify-between gap-3">
            <Checkbox
              label={UI.bugaderia.avui.withSweater}
              checked={withSweater}
              onChange={(e) => setWithSweater(e.target.checked)}
            />
            {/* Silent when the combination lands in no palette: that is
                not an error, just one the catalogue doesn't cover. */}
            {resolvedPalette && (
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex shrink-0 gap-0.5">
                  {resolvedPalette.colores.map((color, i) => (
                    <span
                      key={i}
                      className="inline-block h-3 w-4"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <Text
                  variant="small"
                  italic
                  tone="secondary"
                  className="font-serif truncate"
                >
                  {resolvedPalette.nombre}
                </Text>
              </div>
            )}
          </div>

          {/* A disabled button with no reason reads as broken — name the
              rows still waiting for a pick (an empty row can never fill
              itself, so this is the only way out of a dead button). */}
          {!canWear && (
            <Text
              variant="small"
              italic
              tone="secondary"
              className="font-serif shrink-0 text-center"
            >
              {UI.bugaderia.avui.missingRows(
                missingRows.map((c) => CATEGORY_LABELS[c].toLowerCase()).join(", "),
              )}
            </Text>
          )}

          {isWorn ? (
            <div className="flex shrink-0 flex-col items-center gap-1">
              <Button type="button" size="lg" variant="secondary" disabled className="w-full gap-2">
                <Icon name="check" size={16} />
                {UI.bugaderia.avui.wornImprovised}
              </Button>
              <TextButton type="button" tone="secondary" onClick={() => setWornKey(null)}>
                {UI.bugaderia.avui.changeIt}
              </TextButton>
            </div>
          ) : (
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
          )}
        </>
      ) : (
        <div>
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
