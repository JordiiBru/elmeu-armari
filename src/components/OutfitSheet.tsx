"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { deleteOutfitAction, wearOutfitAction } from "@/app/outfits/actions";
import { UI } from "@/lib/prendas/ui-strings";
import type { SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { dirtyGarmentsOf } from "@/lib/bugaderia/laundry";
import { formatLastWorn, lastWornExtras } from "@/lib/outfits/worn";
import { PieceThumb } from "./PieceThumb";
import { OutfitCollage, outfitSubtitle, paletteName, pieceLabel } from "./OutfitTile";
import { WearGrids, WearTabs, useWearGroups, type WearTab } from "./WearPicker";
import {
  Button,
  Sheet,
  Stack,
  Text,
  TextButton,
} from "@/components/ui";

function weekdayLabel(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("ca", {
    weekday: "long",
    timeZone: "UTC",
  });
}

interface Props {
  outfit: SavedOutfit;
  palette: SanzoPalette | null;
  /** Every garment that can be worn with an outfit, already filtered to
   * the extra categories by the surface that owns the catalogue. */
  extraCandidates: GarmentWithColors[];
  /** The day being committed, YYYY-MM-DD. */
  dayISO: string;
  todayISO: string;
  /** True when this outfit is the one already committed to `dayISO`. */
  isCommitted?: boolean;
  /** What that day already records, when it is this outfit's day. Falls
   * back to what the outfit was last worn with. */
  dayExtras?: GarmentWithColors[];
  /** Deleting from the calendar would strand the day being planned, so
   * only the library offers it. */
  allowDelete?: boolean;
  onClose: () => void;
  /** Up one level, back to whatever opened this. When set, dismissing
   * means leaving entirely — the same split as the combiner's. */
  onBack?: () => void;
  onCommitted?: () => void;
  /** Calendar only: go back to the outfit grid for this day. */
  onChangeOutfit?: () => void;
  /** Calendar only: empty the day. */
  onClear?: () => void;
}

/**
 * One sheet for reading an outfit and for committing a day with it. The
 * three surfaces that can decide a day (Desats, Què em poso, calendar)
 * differ only in the footer's action and in the two quiet actions at the
 * bottom of the body.
 */
export function OutfitSheet({
  outfit,
  palette,
  extraCandidates,
  dayISO,
  todayISO,
  isCommitted = false,
  dayExtras,
  allowDelete = false,
  onClose,
  onBack,
  onCommitted,
  onChangeOutfit,
  onClear,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const preselected = useMemo(
    () => (isCommitted && dayExtras ? dayExtras : lastWornExtras(outfit)),
    [isCommitted, dayExtras, outfit],
  );

  const [shoeId, setShoeId] = useState<string | null>(
    () => preselected.find((g) => g.category === "SHOES")?.id ?? null,
  );
  const [extraIds, setExtraIds] = useState<string[]>(() =>
    preselected.filter((g) => g.category !== "SHOES").map((g) => g.id),
  );
  const [tab, setTab] = useState<WearTab>("shoes");
  const groups = useWearGroups(extraCandidates);

  const title = outfitSubtitle(outfit) || outfit.name || "";
  const blockedBy = dirtyGarmentsOf(outfit);
  const isToday = dayISO === todayISO;
  // The clean gate is only about today and the past: a shirt in the
  // basket on Monday can perfectly well be clean by Thursday.
  const blocked = dayISO <= todayISO && blockedBy.length > 0;

  const picked = useMemo(() => {
    const byId = new Map(extraCandidates.map((g) => [g.id, g]));
    return [shoeId, ...extraIds]
      .filter((id): id is string => id !== null)
      .map((id) => byId.get(id))
      .filter((g): g is GarmentWithColors => g !== undefined);
  }, [extraCandidates, shoeId, extraIds]);

  const subtitle = [paletteName(palette), formatLastWorn(outfit.wornEvents)]
    .filter(Boolean)
    .join(" · ");

  const toggleExtra = (id: string) => {
    setExtraIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  // Every action goes through startTransition: called outside one, the
  // action's revalidatePath races the client promise and it never
  // resolves — the button stays pending forever.
  const handleWear = () => {
    startTransition(async () => {
      await wearOutfitAction(outfit.id, dayISO, picked.map((g) => g.id));
      onCommitted?.();
      onClose();
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteOutfitAction(outfit.id);
      onClose();
    });
  };

  const deleteCost =
    outfit.wornEvents.length === 0
      ? null
      : outfit.wornEvents.length < 3
        ? UI.outfits.deleteCost(outfit.wornEvents.length)
        : UI.outfits.deleteCostMany;

  return (
    <Sheet
      onClose={onClose}
      size="xl"
      // The two tabs hold grids of very different heights, and the sheet
      // used to resize under the tab bar every time you switched. Fixed
      // height, tabs pinned, grid scrolls.
      fill
      label={`Outfit ${title}`}
      media={
        <OutfitCollage
          garments={outfit.garments}
          thumb={false}
          sizes="(min-width: 640px) 32rem, 100vw"
          className="h-full w-full"
        />
      }
      // The panel is a fixed height now, so every pixel of hero is a
      // pixel the grid below does not get. Enough photograph to know
      // which outfit you opened, and no more.
      mediaHeight="h-36 sm:h-56"
      header={
        <div className="flex items-start justify-between gap-3">
          <Stack gap={1} className="min-w-0">
            <h2 className="type-title lowercase">{title}</h2>
            <Text variant="small" italic tone="secondary" className="font-serif">
              {subtitle}
            </Text>
            {palette && (
              <div aria-hidden className="mt-1 flex h-1 w-full max-w-40 overflow-hidden">
                {palette.colores.map((hex, i) => (
                  <span key={i} className="flex-1" style={{ backgroundColor: hex }} />
                ))}
              </div>
            )}
          </Stack>
          {onBack && (
            <TextButton type="button" tone="secondary" onClick={onBack}>
              {UI.outfits.back}
            </TextButton>
          )}
        </div>
      }
      headerBelow={
        <div className="px-6 py-2">
          <WearTabs
            groups={groups}
            tab={tab}
            onChange={setTab}
            shoeId={shoeId}
            extraIds={extraIds}
          />
        </div>
      }
      footer={
        <div className="flex items-center justify-between gap-4">
          {/* A disabled button with a grey whisper next to it reads as a
              broken button. The reason carries the warning ink and, next
              to it, the way out of the situation. */}
          {blocked ? (
            <Stack gap={1} className="min-w-0 flex-1">
              <Text
                variant="small"
                italic
                className="font-serif lowercase text-warning"
              >
                {UI.outfits.blockedReason(blockedBy.map(pieceLabel))}
              </Text>
              <Link
                href="/bugaderia?vista=cistell"
                className="font-serif italic type-small text-text-secondary underline underline-offset-4 hover:text-text-primary transition-colors duration-[var(--duration-base)]"
              >
                {UI.outfits.goToRentar}
              </Link>
            </Stack>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
              {picked.map((g) => (
                <PieceThumb
                  key={g.id}
                  garment={g}
                  thumb
                  sizes="40px"
                  className="h-10 w-10 flex-shrink-0"
                />
              ))}
            </div>
          )}
          <Button
            type="button"
            onClick={handleWear}
            disabled={pending || blocked}
            loading={pending}
            loadingText={UI.outfits.saving}
            className="flex-shrink-0"
          >
            {isToday
              ? UI.outfits.wearToday
              : UI.outfits.wearOnDay(weekdayLabel(dayISO))}
          </Button>
        </div>
      }
    >
      <WearGrids
        groups={groups}
        tab={tab}
        shoeId={shoeId}
        extraIds={extraIds}
        onSelectShoe={setShoeId}
        onToggleExtra={toggleExtra}
        disabled={pending}
      />

      <div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
        {confirmingDelete ? (
          <>
            <Text variant="small" italic tone="secondary" className="font-serif">
              {deleteCost}
            </Text>
            <div className="flex items-center gap-4">
              <TextButton
                type="button"
                tone="secondary"
                onClick={() => setConfirmingDelete(false)}
                disabled={pending}
              >
                {UI.outfits.cancel}
              </TextButton>
              <TextButton
                type="button"
                tone="danger"
                onClick={handleDelete}
                disabled={pending}
              >
                {pending ? UI.outfits.deleting : UI.outfits.deleteConfirm}
              </TextButton>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-4">
              {onChangeOutfit && (
                <TextButton
                  type="button"
                  tone="secondary"
                  onClick={onChangeOutfit}
                  disabled={pending}
                >
                  {UI.outfits.changeOutfit}
                </TextButton>
              )}
            </div>
            {allowDelete ? (
              <TextButton
                type="button"
                tone="danger"
                onClick={() => setConfirmingDelete(true)}
                disabled={pending}
              >
                {UI.outfits.delete}
              </TextButton>
            ) : (
              isCommitted &&
              onClear && (
                <TextButton
                  type="button"
                  tone="danger"
                  onClick={onClear}
                  disabled={pending}
                >
                  {UI.outfits.removeFromDay}
                </TextButton>
              )
            )}
          </>
        )}
      </div>
    </Sheet>
  );
}
