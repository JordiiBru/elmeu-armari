"use client";

import { useTranslations } from "next-intl";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { PieceThumb } from "./PieceThumb";
import { pieceLabel, pieceTint } from "./OutfitTile";
import { Stack, Text } from "@/components/ui";

/**
 * Everything worn on a day, named and coloured: the caption to the
 * photograph above it. The photo says what the day looked like; this says
 * which pieces it was made of, which is what you came back to the day to
 * find out.
 *
 * The colour is the nearest Sanzo Wada name, the same vocabulary the rest
 * of the app uses to tell two shirts of the same kind apart.
 */
export function DayPieces({ garments }: { garments: GarmentWithColors[] }) {
  const t = useTranslations("labels");

  return (
    <Stack as="ul" gap={4}>
      {garments.map((g) => {
        const tint = pieceTint(g);
        return (
          <li key={g.id} className="flex items-center gap-4">
            <PieceThumb
              garment={g}
              thumb
              sizes="48px"
              className="h-12 w-12 flex-shrink-0"
            />
            <Text as="span" truncate className="min-w-0 flex-1 font-serif lowercase">
              {pieceLabel(t, g)}
            </Text>
            {tint && (
              <Text variant="caption" tone="secondary" className="flex-shrink-0">
                {tint}
              </Text>
            )}
            <span aria-hidden className="flex flex-shrink-0 gap-1">
              {g.colors.map((c) => (
                <span
                  key={c.id}
                  className="block h-3 w-3"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </span>
          </li>
        );
      })}
    </Stack>
  );
}
