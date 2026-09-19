"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { PieceThumb } from "./PieceThumb";
import { pieceLabel } from "./OutfitTile";
import { EmptyState, Icon, Stack, Text } from "@/components/ui";

export interface WearGroups {
  accessories: GarmentWithColors[];
}

const PICKER_SIZES = "(min-width: 1024px) 12vw, (min-width: 640px) 15vw, 40vw";

function PickTile({
  garment,
  selected,
  disabled,
  onClick,
}: {
  garment: GarmentWithColors;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const t = useTranslations("labels");
  const label = pieceLabel(t, garment);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={label}
      className="group flex min-h-11 flex-col gap-2 text-left outline-none transition-transform duration-[var(--duration-base)] ease-[var(--ease-standard)] active:scale-[0.98] disabled:opacity-40 focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-4 focus-visible:ring-offset-elevated"
    >
      <div
        className={`relative aspect-square w-full overflow-hidden border transition-colors duration-[var(--duration-base)] ease-[var(--ease-standard)] ${
          selected
            ? "border-border-strong"
            : "border-transparent group-hover:border-border"
        }`}
      >
        <PieceThumb garment={garment} thumb sizes={PICKER_SIZES} className="h-full w-full" />
        {selected && (
          <span className="absolute bottom-1 right-1 inline-flex bg-elevated p-1 text-text-primary">
            <Icon name="check" size={12} />
          </span>
        )}
      </div>
      <Text
        variant="small"
        italic
        tone={selected ? "primary" : "secondary"}
        className="font-serif lowercase leading-tight truncate"
      >
        {label}
      </Text>
    </button>
  );
}

function PickGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
      {children}
    </div>
  );
}

/**
 * Shoes moved out of this picker and into the outfit itself — the group
 * you save now commits to the shoes it was matched with, the same way
 * it commits to a shirt. What's left here is what still varies day to
 * day regardless of which outfit you picked: accessories.
 */
export function useWearGroups(candidates: GarmentWithColors[]): WearGroups {
  return useMemo(
    () => ({
      accessories: candidates.filter((g) => g.category === "ACCESSORI"),
    }),
    [candidates],
  );
}

export function WearGrid({
  groups,
  extraIds,
  onToggleExtra,
  disabled,
  suggested = [],
}: {
  groups: WearGroups;
  extraIds: string[];
  onToggleExtra: (id: string) => void;
  disabled?: boolean;
  /** Accessories that match the outfit's palette. Listed above the picker
   * and toggled through the same handler, so picking one here is exactly
   * picking it below. */
  suggested?: GarmentWithColors[];
}) {
  const t = useTranslations("outfits");
  const { accessories } = groups;
  const selectedExtras = useMemo(() => new Set(extraIds), [extraIds]);

  if (accessories.length === 0) {
    return (
      <EmptyState
        title={t("noAccessories")}
        className="py-8"
        action={
          <Link
            href="/add"
            className="font-serif italic type-small text-text-secondary hover:text-text-primary transition-colors duration-[var(--duration-base)]"
          >
            {t("goToAdd")}
          </Link>
        }
      />
    );
  }

  return (
    <Stack gap={5}>
      {suggested.length > 0 && (
        <Stack gap={3}>
          <Text variant="caption">{t("suggestedAccessories")}</Text>
          <PickGrid>
            {suggested.map((g) => (
              <PickTile
                key={g.id}
                garment={g}
                disabled={disabled}
                selected={selectedExtras.has(g.id)}
                onClick={() => onToggleExtra(g.id)}
              />
            ))}
          </PickGrid>
        </Stack>
      )}
      {accessories.length > 0 && (
        <Stack gap={3}>
          <Text variant="caption">{t("accessories")}</Text>
          <PickGrid>
            {accessories.map((g) => (
              <PickTile
                key={g.id}
                garment={g}
                disabled={disabled}
                selected={selectedExtras.has(g.id)}
                onClick={() => onToggleExtra(g.id)}
              />
            ))}
          </PickGrid>
        </Stack>
      )}
    </Stack>
  );
}
