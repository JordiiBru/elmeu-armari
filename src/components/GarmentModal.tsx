"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { deleteGarmentAction } from "@/app/armari/actions";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { EXTRA_CATEGORIES } from "@/lib/prendas/types";
import type { SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import { OutfitBottomSheet } from "./OutfitBottomSheet";
import { OutfitSheet } from "./OutfitSheet";
import { OutfitTile } from "./OutfitTile";
import {
  CATEGORY_LABELS,
  TEXTURE_LABELS,
  PATTERN_LABELS,
  FIT_LABELS,
  SUBTYPE_LABELS,
  LENGTH_LABELS,
  SEASON_LABELS,
} from "@/lib/prendas/labels";
import { UI } from "@/lib/prendas/ui-strings";
import { PieceThumb } from "./PieceThumb";
import { Button, Grid, Sheet, Text, TextButton, Stack } from "@/components/ui";

interface Props {
  garment: GarmentWithColors;
  allGarments: GarmentWithColors[];
  palettes: SanzoPalette[];
  savedOutfitKeys: string[];
  /** The saved looks this piece is part of, ranked for today. */
  outfitsWith: SavedOutfit[];
  /** Everything an outfit can be worn with, for the sheet below. */
  extraCandidates: GarmentWithColors[];
  todayISO: string;
  todayOutfitId: string | null;
  onClose: () => void;
}

export function GarmentModal({
  garment,
  allGarments,
  palettes,
  savedOutfitKeys,
  outfitsWith,
  extraCandidates,
  todayISO,
  todayOutfitId,
  onClose,
}: Props) {
  const [confirming, setConfirming] = useState(false);
  const [combineOpen, setCombineOpen] = useState(false);
  const [openOutfitId, setOpenOutfitId] = useState<string | null>(null);
  // What you saved during this visit. It lives here rather than in the
  // combinations sheet because that sheet unmounts every time you close
  // it, and reopening it on the same piece would otherwise offer to save
  // outfits you had just saved.
  const [savedHere, setSavedHere] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  // Shoes, socks and accessories do not take part in the colour matching,
  // and a piece with no colour has nothing to match on.
  const canCombine =
    garment.colors.length > 0 && !EXTRA_CATEGORIES.has(garment.category);

  const handleDelete = () => {
    if (pending) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("id", garment.id);
      await deleteGarmentAction(fd);
      onClose();
    });
  };

  // Opening one of this piece's looks. Same swap as the combiner, and
  // the same shared `OutfitSheet` every other surface commits a day
  // through — this is a shortcut into it, not a second way of doing it.
  const openOutfit = outfitsWith.find((o) => o.id === openOutfitId) ?? null;
  if (openOutfit) {
    return (
      <OutfitSheet
        outfit={openOutfit}
        palette={palettes.find((p) => p.id === openOutfit.paletteId) ?? null}
        extraCandidates={extraCandidates}
        dayISO={todayISO}
        todayISO={todayISO}
        isCommitted={openOutfit.id === todayOutfitId}
        onBack={() => setOpenOutfitId(null)}
        onClose={onClose}
      />
    );
  }

  // One sheet at a time, never one inside the other. Two mounted `Sheet`s
  // means two Escape listeners (Escape closed both) and the inner one
  // released the body scroll lock on unmount while the outer was still
  // open. Swapping instead of nesting also reads right: "què hi combina"
  // is a level deeper, and closing it comes back to the piece.
  if (combineOpen) {
    return (
      <OutfitBottomSheet
        garment={garment}
        allGarments={allGarments}
        palettes={palettes}
        savedOutfitKeys={[...savedOutfitKeys, ...savedHere]}
        onOutfitSaved={(key) => setSavedHere((prev) => [...prev, key])}
        onBack={() => setCombineOpen(false)}
        onClose={onClose}
      />
    );
  }

  return (
    <Sheet
      onClose={onClose}
      size="md"
      label={`Peça ${CATEGORY_LABELS[garment.category]}`}
      media={<PieceThumb garment={garment} priority className="h-full w-full" />}
      mediaHeight="h-40"
      // The reason this modal replaced a whole screen: matching a piece
      // against Sanzo Wada is the app's centre of gravity, not a footnote
      // to its swatches. Pinned, primary, and the widest thing here.
      footer={
        canCombine ? (
          <Button
            type="button"
            size="lg"
            onClick={() => setCombineOpen(true)}
            className="w-full justify-center"
          >
            {UI.modal.combine}
          </Button>
        ) : undefined
      }
      header={
        <Stack gap={1}>
          <Text variant="caption">peça</Text>
          <h2 className="type-title">
            {CATEGORY_LABELS[garment.category]}
            {garment.subtype && (
              <Text as="span" italic tone="secondary" className="font-serif">
                {" "}· {SUBTYPE_LABELS[garment.subtype]}
              </Text>
            )}
            {garment.length && (
              <Text as="span" italic tone="secondary" className="font-serif">
                {" "}· {LENGTH_LABELS[garment.length]}
              </Text>
            )}
          </h2>
          {(garment.fit || garment.size) && (
            <Text variant="small" italic tone="secondary" className="font-serif">
              {garment.fit && FIT_LABELS[garment.fit]}
              {garment.fit && garment.size && " · "}
              {garment.size && `talla ${garment.size}`}
            </Text>
          )}
        </Stack>
      }
    >
      {/* First thing in the body, before the reference data. Standing in
          front of the wardrobe holding this piece, the looks you have
          already built with it are the answer; texture and pattern are
          the footnotes. */}
      {outfitsWith.length > 0 && (
        <Stack gap={3}>
          <div className="flex items-baseline justify-between gap-3">
            <Text variant="caption" as="h3">
              {UI.outfits.withThisPiece}
            </Text>
            <Text variant="caption" tabular>
              {outfitsWith.length}
            </Text>
          </div>
          {/* Two across, not three. Inside a `md` sheet three columns
              leave about 110px a tile, which truncates every caption —
              and the caption is what names the *other* pieces, the only
              thing you do not already know when you arrive here holding
              this one. */}
          <Grid cols="library" gapX={4} gapY={5} className="!grid-cols-2">
            {outfitsWith.map((outfit, i) => (
              <OutfitTile
                key={outfit.id}
                outfit={outfit}
                palette={palettes.find((p) => p.id === outfit.paletteId) ?? null}
                index={i}
                mark={outfit.id === todayOutfitId ? UI.outfits.today : null}
                onOpen={() => setOpenOutfitId(outfit.id)}
              />
            ))}
          </Grid>
        </Stack>
      )}

      {(garment.texture || garment.pattern) && (
        <dl className="grid grid-cols-2 gap-y-4 gap-x-6">
          {garment.texture && <Meta label={UI.modal.texture} value={TEXTURE_LABELS[garment.texture]} />}
          {garment.pattern && <Meta label={UI.modal.pattern} value={PATTERN_LABELS[garment.pattern]} />}
        </dl>
      )}

      <Stack gap={2}>
        <Text variant="caption">{UI.modal.colors}</Text>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {garment.colors.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <span
                className="inline-block h-4 w-4"
                style={{ backgroundColor: c.hex }}
              />
              <Text variant="mono" tone="secondary" as="span">
                {c.hex}
              </Text>
            </div>
          ))}
        </div>
      </Stack>

      {garment.seasons.length > 0 && (
        <Stack gap={2}>
          <Text variant="caption">{UI.modal.seasons}</Text>
          <div className="flex flex-wrap gap-x-4 gap-y-1 font-serif italic">
            {garment.seasons.map((s, i) => (
              <span key={s.id} className="inline-flex items-center gap-4">
                {i > 0 && (
                  <span
                    aria-hidden
                    className="inline-block h-1 w-1 rounded-full bg-border"
                  />
                )}
                {SEASON_LABELS[s.season]}
              </span>
            ))}
          </div>
        </Stack>
      )}

      {garment.notes && (
        <Stack gap={1}>
          <Text variant="caption">nota</Text>
          <Text as="p" italic className="font-serif">
            {garment.notes}
          </Text>
        </Stack>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Link
          href={`/edit/${garment.id}`}
          className="font-serif italic type-small text-text-primary hover:text-text-secondary transition-colors"
        >
          editar
        </Link>
        {confirming ? (
          <div className="flex items-center gap-4">
            <TextButton
              type="button"
              tone="secondary"
              onClick={() => setConfirming(false)}
              disabled={pending}
            >
              cancel·lar
            </TextButton>
            <TextButton
              type="button"
              tone="danger"
              onClick={handleDelete}
              disabled={pending}
            >
              {pending ? "eliminant…" : `sí, ${UI.buttons.delete.toLowerCase()}`}
            </TextButton>
          </div>
        ) : (
          <TextButton
            type="button"
            tone="danger"
            onClick={() => setConfirming(true)}
          >
            eliminar
          </TextButton>
        )}
      </div>

    </Sheet>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt>
        <Text variant="caption" as="span">{label}</Text>
      </dt>
      <dd className="font-serif">{value}</dd>
    </div>
  );
}
