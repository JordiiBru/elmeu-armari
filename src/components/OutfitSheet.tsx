"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { deleteOutfitAction, wearOutfitAction } from "@/app/outfits/actions";
import type { DayEvent, SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { dirtyGarmentsOf } from "@/lib/bugaderia/laundry";
import { lastWornExtras } from "@/lib/outfits/worn";
import { useFormatLastWorn } from "@/lib/outfits/useLastWorn";
import { PieceThumb } from "./PieceThumb";
import { DayPhoto } from "./DayPhoto";
import { DayPieces } from "./DayPieces";
import { DayPhotoInput } from "./DayPhotoInput";
import { OutfitCollage, outfitSubtitle, paletteName, pieceLabel } from "./OutfitTile";
import { WearGrids, WearTabs, useWearGroups, type WearTab } from "./WearPicker";
import {
  Button,
  Sheet,
  Stack,
  Text,
  TextButton,
} from "@/components/ui";

function weekdayLabel(iso: string, locale: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, {
    weekday: "long",
    // The ISO string is already the day's key, minted at UTC midnight —
    // reading it back in any other zone slides it by a day.
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
  /** The committed day itself, when there is one: what owns the photo.
   * Its presence is what turns this sheet from a picker into a record. */
  dayEvent?: DayEvent | null;
  /** Deleting from the calendar would strand the day being planned, so
   * only the library offers it. */
  allowDelete?: boolean;
  onClose: () => void;
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
  dayEvent = null,
  allowDelete = false,
  onClose,
  onCommitted,
  onChangeOutfit,
  onClear,
}: Props) {
  const t = useTranslations("outfits");
  const tLabel = useTranslations("labels");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const formatLastWorn = useFormatLastWorn();
  const [pending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  /**
   * Two sheets in one. A day that is already decided opens as a record —
   * the photograph of you in it, and the pieces it was made of — because
   * that is what you came back to it for. Choosing, and amending what you
   * wore it with, is the same picker as ever, one quiet action away.
   */
  const isRecord = isCommitted && dayEvent !== null;
  const photo = dayEvent?.image ? dayEvent : null;
  const [editing, setEditing] = useState(false);
  const showPicker = !isRecord || editing;

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

  const title = outfitSubtitle(tLabel, outfit) || outfit.name || "";
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
        ? t("deleteCost", { count: outfit.wornEvents.length })
        : t("deleteCostMany");

  return (
    <Sheet
      onClose={onClose}
      size="xl"
      // The two tabs hold grids of very different heights, and the sheet
      // used to resize under the tab bar every time you switched. Fixed
      // height, tabs pinned, grid scrolls.
      fill
      label={t("sheetLabel", { title })}
      media={
        photo ? (
          <DayPhoto
            event={photo}
            sizes="(min-width: 640px) 32rem, 100vw"
            className="h-full w-full"
          />
        ) : (
          <OutfitCollage
            garments={outfit.garments}
            thumb={false}
            sizes="(min-width: 640px) 32rem, 100vw"
            className="h-full w-full"
          />
        )
      }
      // A collage is a reminder of which outfit you opened, and the panel
      // is a fixed height, so it gets no more room than that. A photograph
      // of you wearing it is the reason the sheet exists, and gets the
      // half of the panel a standing figure needs.
      mediaHeight={photo ? "h-[38dvh] sm:h-[26rem]" : "h-36 sm:h-56"}
      header={
        <Stack gap={1}>
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
      }
      headerBelow={
        showPicker ? (
          <div className="px-6 py-2">
            <WearTabs
              groups={groups}
              tab={tab}
              onChange={setTab}
              shoeId={shoeId}
              extraIds={extraIds}
            />
          </div>
        ) : undefined
      }
      footer={
        showPicker ? (
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
                {t("blockedReason", {
                  pieces: blockedBy
                    .map((g) => pieceLabel(tLabel, g))
                    .join(t("piecesJoin")),
                })}
              </Text>
              <Link
                href="/bugaderia?vista=cistell"
                className="font-serif italic type-small text-text-secondary underline underline-offset-4 hover:text-text-primary transition-colors duration-[var(--duration-base)]"
              >
                {t("goToRentar")}
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
            loadingText={t("saving")}
            className="flex-shrink-0"
          >
            {isToday
              ? t("wearToday")
              : t("wearOnDay", { day: weekdayLabel(dayISO, locale) })}
          </Button>
        </div>
        ) : undefined
      }
    >
      {showPicker ? (
        <WearGrids
          groups={groups}
          tab={tab}
          shoeId={shoeId}
          extraIds={extraIds}
          onSelectShoe={setShoeId}
          onToggleExtra={toggleExtra}
          disabled={pending}
        />
      ) : (
        <DayPieces garments={[...outfit.garments, ...(dayExtras ?? [])]} />
      )}

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
                {tCommon("cancel")}
              </TextButton>
              <TextButton
                type="button"
                tone="danger"
                onClick={handleDelete}
                disabled={pending}
              >
                {pending ? tCommon("deleting") : tCommon("deleteConfirm")}
              </TextButton>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-4">
              {/* The optional half of the day, and the first thing offered:
                  everything else here amends a decision already taken. */}
              {isRecord && !editing && dayEvent && (
                <>
                  <DayPhotoInput
                    eventId={dayEvent.id}
                    hasPhoto={photo !== null}
                    withRemove
                    disabled={pending}
                  />
                  <TextButton
                    type="button"
                    tone="secondary"
                    onClick={() => setEditing(true)}
                    disabled={pending}
                  >
                    {t("howYouWearIt")}
                  </TextButton>
                </>
              )}
              {/* Only while picking. A record already offers the way into
                  the picker, and the two together made a row of five
                  italic links under a photograph. */}
              {onChangeOutfit && showPicker && (
                <TextButton
                  type="button"
                  tone="secondary"
                  onClick={onChangeOutfit}
                  disabled={pending}
                >
                  {t("changeOutfit")}
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
                {t("delete")}
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
                  {t("removeFromDay")}
                </TextButton>
              )
            )}
          </>
        )}
      </div>
    </Sheet>
  );
}
