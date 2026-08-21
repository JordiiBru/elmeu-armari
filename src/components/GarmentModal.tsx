"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { deleteGarmentAction } from "@/app/armari/actions";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { EXTRA_CATEGORIES } from "@/lib/prendas/types";
import type { SanzoPalette } from "@/lib/outfits/types";
import { OutfitBottomSheet } from "./OutfitBottomSheet";
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
import { Button, Sheet, Text, TextButton, Stack } from "@/components/ui";

interface Props {
  garment: GarmentWithColors;
  allGarments: GarmentWithColors[];
  palettes: SanzoPalette[];
  savedOutfitKeys: string[];
  onClose: () => void;
}

export function GarmentModal({
  garment,
  allGarments,
  palettes,
  savedOutfitKeys,
  onClose,
}: Props) {
  const [confirming, setConfirming] = useState(false);
  const [combineOpen, setCombineOpen] = useState(false);
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
      /**
       * A full navigation, not `router.back()` and not a redirect from
       * the action. Deleting happens from `/armari/[slug]`, and the
       * moment the piece is gone that route renders a 404 — which the
       * client router then caches for the segment, so every softer way
       * out lands on that 404 even once the URL says `/armari`
       * (reproduced: grid empty, "This page could not be found", no way
       * back without a reload).
       *
       * Deleting a garment is rare and irreversible, so paying for one
       * clean page load is the right trade for never stranding anyone.
       */
      window.location.assign("/armari");
    });
  };

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
