"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteGarmentAction } from "@/app/armari/actions";
import type { GarmentWithColors } from "@/lib/prendas/types";
import {
  CATEGORY_LABELS,
  TEXTURE_LABELS,
  PATTERN_LABELS,
  FIT_LABELS,
  SUBTYPE_LABELS,
  SEASON_LABELS,
} from "@/lib/prendas/labels";
import { UI } from "@/lib/prendas/ui-strings";
import { PieceThumb } from "./PieceThumb";
import { Sheet, Text, TextButton, Stack } from "@/components/ui";

interface Props {
  garment: GarmentWithColors;
  onClose: () => void;
}

export function GarmentModal({ garment, onClose }: Props) {
  const [confirming, setConfirming] = useState(false);

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
          </h2>
          <Text variant="small" italic tone="secondary" className="font-serif">
            {FIT_LABELS[garment.fit]} · talla {garment.size}
          </Text>
        </Stack>
      }
    >
      <dl className="grid grid-cols-2 gap-y-4 gap-x-6">
        <Meta label={UI.modal.texture} value={TEXTURE_LABELS[garment.texture]} />
        <Meta label={UI.modal.pattern} value={PATTERN_LABELS[garment.pattern]} />
      </dl>

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
          <form action={deleteGarmentAction} className="flex items-center gap-4">
            <input type="hidden" name="id" value={garment.id} />
            <TextButton
              type="button"
              tone="secondary"
              onClick={() => setConfirming(false)}
            >
              cancel·lar
            </TextButton>
            <TextButton type="submit" tone="danger">
              sí, {UI.buttons.delete.toLowerCase()}
            </TextButton>
          </form>
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
