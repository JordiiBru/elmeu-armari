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
import { WearGrid, useWearGroups } from "./WearPicker";
import { suggestAccessories } from "@/lib/outfits/accessories";
import {
  Button,
  SegmentedControl,
  Sheet,
  Stack,
  Text,
  TextButton,
} from "@/components/ui";

function weekdayLabel(iso: string, locale: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "short",
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
  /** The collection: the day is chosen here (today, yesterday, any
   * date), so a day already gone can be recorded after the fact. The
   * calendar passes its own day and leaves this off. */
  chooseDay?: boolean;
  /** Load this outfit into the builder to keep trying from it. */
  onTry?: () => void;
  /** True when this sheet is stepping in for a sibling sheet rather than
   * opening fresh — see `Sheet`'s own doc on the prop it forwards to. */
  skipEnter?: boolean;
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
  chooseDay = false,
  onTry,
  skipEnter,
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

  // The day starts from the accessories saved with the outfit (they are
  // part of its palette); untick them if they stay home today.
  const preselected = useMemo(
    () =>
      isCommitted && dayExtras
        ? dayExtras
        : outfit.accessories.length > 0
          ? outfit.accessories
          : lastWornExtras(outfit),
    [isCommitted, dayExtras, outfit],
  );
  const [day, setDay] = useState(dayISO);

  const [extraIds, setExtraIds] = useState<string[]>(() => preselected.map((g) => g.id));
  const groups = useWearGroups(extraCandidates);
  const suggested = useMemo(
    () => suggestAccessories(outfit.garments, palette, groups.accessories).map((s) => s.garment),
    [outfit, palette, groups.accessories],
  );

  const title = outfitSubtitle(tLabel, outfit) || outfit.name || "";
  const blockedBy = dirtyGarmentsOf(outfit);
  const isToday = day === todayISO;
  // The clean gate is only about today: a shirt in the basket on Monday
  // can perfectly well be clean by Thursday, and the basket now says
  // nothing about a day that has already gone.
  const blocked = isToday && blockedBy.length > 0;

  const picked = useMemo(() => {
    const byId = new Map(extraCandidates.map((g) => [g.id, g]));
    return extraIds
      .map((id) => byId.get(id))
      .filter((g): g is GarmentWithColors => g !== undefined);
  }, [extraCandidates, extraIds]);

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
      await wearOutfitAction(outfit.id, day, picked.map((g) => g.id));
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
      // The photograph (or the outfit's figure) stands in its own column
      // beside the body, the same split as the garment sheet.
      size="2xl"
      split
      skipEnter={skipEnter}
      // A record's photograph and a picker's grid are different heights,
      // and the sheet used to resize under the header on every state
      // change. Fixed height, grid scrolls.
      fill
      label={t("sheetLabel", { title })}
      media={
        photo ? (
          <DayPhoto
            event={photo}
            sizes="(min-width: 640px) 24rem, 100vw"
            className="h-full w-full"
          />
        ) : (
          // No photograph: the outfit as it is worn stands in for it.
          // Wide, it is boxed to its own proportion rather than stretched
          // up a whole column — and the proportion is taken from the
          // width, the direction every engine agrees on (Safari ignored
          // `max-h-full` against a derived width and spilled the box over
          // the pieces). Stacked there is no proportion to keep: the band
          // is already the shape of a photograph.
          <div className="flex h-full w-full items-center justify-center p-2 sm:p-6">
            <div className="aspect-[4/5] h-full max-w-full sm:h-auto sm:w-full sm:max-h-full">
              <OutfitCollage
                garments={outfit.garments}
                accessories={outfit.accessories}
                thumb={false}
                sizes="(min-width: 640px) 20rem, 80vw"
                className="h-full w-full"
              />
            </div>
          </div>
        )
      }
      // Phone: the record keeps a third of the panel for the photograph;
      // while picking the figure shrinks to a band, so the accessories
      // stay in view. Wide, the column always holds it: it is what you
      // are dressing.
      mediaHeight={
        isRecord && !editing ? (photo ? "h-[38dvh]" : "h-56") : "h-52"
      }
      header={
        <Stack gap={1}>
          <h2 className="type-title lowercase">{title}</h2>
          <Text variant="small" italic tone="secondary" className="font-serif">
            {subtitle}
          </Text>
          {palette && (
            <div aria-hidden className="mt-1.5 flex h-2 w-full max-w-40 overflow-hidden">
              {palette.colores.map((hex, i) => (
                <span key={i} className="flex-1" style={{ backgroundColor: hex }} />
              ))}
            </div>
          )}
        </Stack>
      }
      footer={
        confirmingDelete ? (
          // Its own footer state rather than squeezed in beside "me'l
          // poso": on a phone the two rows together didn't fit, and a
          // decision this final shouldn't compete with an unrelated
          // button for the thumb reaching for it.
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Text variant="small" italic tone="secondary" className="font-serif">
              {deleteCost}
            </Text>
            <div className="flex items-center gap-4 flex-shrink-0">
              <TextButton
                type="button"
                tone="secondary"
                onClick={() => setConfirmingDelete(false)}
                disabled={pending}
                className="type-small"
              >
                {tCommon("cancel")}
              </TextButton>
              <TextButton
                type="button"
                tone="danger"
                onClick={handleDelete}
                disabled={pending}
                className="type-small"
              >
                {pending ? tCommon("deleting") : tCommon("deleteConfirm")}
              </TextButton>
            </div>
          </div>
        ) : allowDelete || (isCommitted && onClear) || showPicker ? (
          <div className="flex items-center justify-between gap-4">
            {/* Pinned rather than left at the bottom of the scrolling
                body: on a well-stocked wardrobe's WearGrid, "eliminar"
                sat a full screen of accessories below the
                fold. It is destructive and irreversible — the one
                action here that should never cost a scroll to reach. */}
            {allowDelete ? (
              <TextButton
                type="button"
                tone="danger"
                onClick={() => setConfirmingDelete(true)}
                disabled={pending}
                className="flex-shrink-0 type-small"
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
                  className="flex-shrink-0 type-small"
                >
                  {t("removeFromDay")}
                </TextButton>
              )
            )}

            {showPicker && (
              <>
                {/* A disabled button with a grey whisper next to it reads
                    as a broken button. The reason carries the warning ink
                    and, next to it, the way out of the situation. */}
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
                    : t("wearOnDay", { day: weekdayLabel(day, locale) })}
                </Button>
              </>
            )}
          </div>
        ) : undefined
      }
    >
      {showPicker && chooseDay && (
        <DayChooser value={day} todayISO={todayISO} onChange={setDay} disabled={pending} />
      )}
      {showPicker ? (
        <WearGrid
          groups={groups}
          extraIds={extraIds}
          onToggleExtra={toggleExtra}
          disabled={pending}
          suggested={suggested}
        />
      ) : (
        <DayPieces garments={[...outfit.garments, ...(dayExtras ?? [])]} />
      )}

      {/* What's left once the destructive action moved to the pinned
          footer: quieter, occasional actions that earning a scroll past
          the grid is a fair price for. */}
      {onTry && !isRecord && (
        <div className="mt-6 border-t border-border pt-4">
          <TextButton type="button" tone="secondary" onClick={onTry} disabled={pending}>
            {t("tryInBuilder")}
          </TextButton>
        </div>
      )}

      {(isRecord || onChangeOutfit) && (
        <Stack gap={4} className="mt-auto">
          {isRecord && !editing && dayEvent && (
            <DayPhotoInput
              eventId={dayEvent.id}
              hasPhoto={photo !== null}
              withRemove
              disabled={pending}
            />
          )}

          {((isRecord && !editing) || (onChangeOutfit && showPicker)) && (
            <div className="flex flex-wrap items-center gap-4 border-t border-border pt-4">
              {isRecord && !editing && (
                <TextButton
                  type="button"
                  tone="secondary"
                  onClick={() => setEditing(true)}
                  disabled={pending}
                >
                  {tCommon("edit")}
                </TextButton>
              )}
              {/* Only while picking. A record already offers the way into
                  the picker. */}
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
          )}
        </Stack>
      )}
    </Sheet>
  );
}


/**
 * Which day this outfit goes on: today, or any other date. A past day
 * records what was worn after the fact (it never dirties anything); a
 * future one plans it.
 */
function DayChooser({
  value,
  todayISO,
  onChange,
  disabled,
}: {
  value: string;
  todayISO: string;
  onChange: (iso: string) => void;
  disabled: boolean;
}) {
  const t = useTranslations("outfits.day");
  const [other, setOther] = useState(value !== todayISO);
  return (
    <div className="mb-6 flex min-h-11 flex-wrap items-center gap-x-6 gap-y-3 border-b border-border-subtle pb-4">
      <SegmentedControl<"TODAY" | "OTHER">
        value={other ? "OTHER" : "TODAY"}
        onChange={(v) => {
          setOther(v === "OTHER");
          if (v === "TODAY") onChange(todayISO);
        }}
        wrap={false}
        ariaLabel={t("aria")}
        options={[
          { value: "TODAY", label: t("today") },
          { value: "OTHER", label: t("other") },
        ]}
      />
      {other && (
        <input
          type="date"
          value={value}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          disabled={disabled}
          aria-label={t("aria")}
          className="min-h-11 border-b border-border bg-transparent font-serif type-small text-text-primary outline-none focus-visible:border-border-strong"
        />
      )}
    </div>
  );
}
