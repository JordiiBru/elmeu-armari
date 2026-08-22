"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { PieceThumb } from "./PieceThumb";
import { pieceLabel } from "./OutfitTile";
import { EmptyState, Icon, SegmentedControl, Stack, Text } from "@/components/ui";

export type WearTab = "shoes" | "accessories";

export interface WearGroups {
  shoes: GarmentWithColors[];
  accessories: GarmentWithColors[];
  socks: GarmentWithColors[];
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

function PickerEmpty({ title }: { title: string }) {
  const t = useTranslations("outfits");
  return (
    <EmptyState
      title={title}
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

/**
 * Shoes and accessories for one day, picked in place instead of in a
 * second sheet: sheets don't nest in this app (the panel is a containing
 * block for fixed descendants and clips overflow), and a wizard would add
 * two taps to the app's most frequent action. One tab visible at a time
 * also gives each photograph the full sheet width, which is the point.
 *
 * Tabs and grid ship as two components on purpose: the sheet pins
 * `WearTabs` above its scrolling body and scrolls `WearGrids` under it,
 * so switching tab moves the grid and nothing else. They share the one
 * split of the catalogue this hook computes.
 */
export function useWearGroups(candidates: GarmentWithColors[]): WearGroups {
  return useMemo(
    () => ({
      shoes: candidates.filter((g) => g.category === "SHOES"),
      accessories: candidates.filter((g) => g.category === "ACCESSORI"),
      // Socks today; any other future EXTRA_CATEGORIES member that is
      // neither shoes nor accessories lands here, unlimited like them.
      socks: candidates.filter(
        (g) => g.category !== "SHOES" && g.category !== "ACCESSORI",
      ),
    }),
    [candidates],
  );
}

function countLabel(label: string, n: number) {
  return (
    <>
      {label}
      {n > 0 && <span className="tabular-nums"> {n}</span>}
    </>
  );
}

export function WearTabs({
  groups,
  tab,
  onChange,
  shoeId,
  extraIds,
}: {
  groups: WearGroups;
  tab: WearTab;
  onChange: (tab: WearTab) => void;
  shoeId: string | null;
  extraIds: string[];
}) {
  const t = useTranslations("outfits");
  const selected = useMemo(() => new Set(extraIds), [extraIds]);
  const accessoryCount = [...groups.accessories, ...groups.socks].filter((g) =>
    selected.has(g.id),
  ).length;

  return (
    <SegmentedControl<WearTab>
      value={tab}
      onChange={onChange}
      ariaLabel={t("howYouWearIt")}
      options={[
        { value: "shoes", label: countLabel(t("shoes"), shoeId ? 1 : 0) },
        {
          value: "accessories",
          label: countLabel(t("accessories"), accessoryCount),
        },
      ]}
    />
  );
}

export function WearGrids({
  groups,
  tab,
  shoeId,
  extraIds,
  onSelectShoe,
  onToggleExtra,
  disabled,
}: {
  groups: WearGroups;
  tab: WearTab;
  shoeId: string | null;
  extraIds: string[];
  onSelectShoe: (id: string | null) => void;
  onToggleExtra: (id: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("outfits");
  const { shoes, accessories, socks } = groups;
  const selectedExtras = useMemo(() => new Set(extraIds), [extraIds]);

  return (
    // Keyed on the tab so the panel re-enters instead of swapping dry.
    <div key={tab} className="panel-enter">
      {tab === "shoes" &&
        (shoes.length === 0 ? (
          <PickerEmpty title={t("noShoes")} />
        ) : (
          <PickGrid>
            {shoes.map((g) => (
              <PickTile
                key={g.id}
                garment={g}
                disabled={disabled}
                selected={shoeId === g.id}
                onClick={() => onSelectShoe(shoeId === g.id ? null : g.id)}
              />
            ))}
          </PickGrid>
        ))}

      {tab === "accessories" &&
        (accessories.length === 0 && socks.length === 0 ? (
          <PickerEmpty title={t("noAccessories")} />
        ) : (
          <Stack gap={5}>
            {accessories.length > 0 && (
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
            )}
            {socks.length > 0 && (
              <Stack gap={3}>
                <Text variant="caption">{t("socks")}</Text>
                <PickGrid>
                  {socks.map((g) => (
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
        ))}
    </div>
  );
}
