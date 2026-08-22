"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import PaletteSheet from "@/components/PaletteSheet";
import { Input, Card, Text, EmptyState } from "@/components/ui";

type ColorEntry = {
  index: number;
  name: string;
  hex: string;
  combinations: number[];
};

type Palette = {
  id: number;
  colors: { hex: string; name: string | null }[];
};

export default function PaletaBrowser({
  colors,
  palettesById,
}: {
  colors: ColorEntry[];
  palettesById: Record<number, Palette>;
}) {
  const t = useTranslations("paleta");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ColorEntry | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return colors;
    return colors.filter(
      (c) => c.name.toLowerCase().includes(q) || c.hex.toLowerCase().includes(q),
    );
  }, [colors, query]);

  return (
    <>
      <div className="mb-10">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
        />
        <div className="flex items-baseline justify-between pt-2">
          <span className="type-caption tabular-nums">
            {t("count", { shown: filtered.length, total: colors.length })}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={t("noResults")}
          hint={t("noResultsHint")}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-12">
          {filtered.map((c) => (
            <Card
              key={c.index}
              as="button"
              interactive="clickable"
              type="button"
              onClick={() => setSelected(c)}
            >
              <div
                className="aspect-square w-full transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)] group-hover:-translate-y-1 group-active:translate-y-0"
                style={{ backgroundColor: c.hex }}
              />
              <div className="flex items-baseline justify-between pt-3">
                <Text as="span" className="font-serif leading-tight">
                  {c.name}
                </Text>
                <Text variant="caption" tabular>
                  n{String(c.index).padStart(3, "0")}
                </Text>
              </div>
              <div className="flex items-baseline justify-between mt-0.5">
                <Text variant="mono" tone="secondary" as="span">
                  {c.hex.toUpperCase()}
                </Text>
                {c.combinations.length > 0 && (
                  <Text variant="small" italic tone="secondary" className="font-serif">
                    {t("combinations", { count: c.combinations.length })}
                  </Text>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <PaletteSheet
          color={selected}
          palettes={selected.combinations
            .map((id) => palettesById[id])
            .filter(Boolean)}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
