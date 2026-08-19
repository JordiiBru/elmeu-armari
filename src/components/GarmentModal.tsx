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
import { Sheet, Text, TextButton, Stack } from "@/components/ui";

interface Props {
  garment: GarmentWithColors;
  allGarments: GarmentWithColors[];
  palettes: SanzoPalette[];
  onClose: () => void;
}

export function GarmentModal({ garment, allGarments, palettes, onClose }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [combineOpen, setCombineOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    if (pending) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("id", garment.id);
      await deleteGarmentAction(fd);
      onClose();
    });
  };

  return (
    <Sheet
      onClose={onClose}
      size="md"
      label={`Peça ${CATEGORY_LABELS[garment.category]}`}
      media={<PieceThumb garment={garment} priority className="h-full w-full" />}
      mediaHeight="h-40"
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
        {garment.colors.length > 0 && !EXTRA_CATEGORIES.has(garment.category) && (
          <TextButton
            type="button"
            tone="secondary"
            onClick={() => setCombineOpen(true)}
            className="self-start"
          >
            què hi combina
          </TextButton>
        )}
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

      {combineOpen && (
        <OutfitBottomSheet
          garment={garment}
          allGarments={allGarments}
          palettes={palettes}
          onClose={() => setCombineOpen(false)}
        />
      )}
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
