"use client";

import { useTranslations } from "next-intl";
import { Sheet, Text, Stack } from "@/components/ui";

type Palette = {
  id: number;
  colors: { hex: string; name: string | null }[];
};

type Color = {
  index: number;
  name: string;
  hex: string;
  combinations: number[];
};

export default function PaletteSheet({
  color,
  palettes,
  onClose,
}: {
  color: Color;
  palettes: Palette[];
  onClose: () => void;
}) {
  const t = useTranslations("paleta");

  return (
    <Sheet
      onClose={onClose}
      size="xl"
      label={t("sheetLabel", { color: color.name })}
      media={<div className="h-full w-full" style={{ backgroundColor: color.hex }} />}
      mediaHeight="h-24 sm:h-32"
      header={
        <Stack gap={1}>
          <Text variant="caption">{t("colorEyebrow")}</Text>
          <h2 className="type-title-xl">{color.name}</h2>
          <p className="font-serif italic type-small text-text-secondary">
            <Text as="span" variant="mono" tone="secondary" className="not-italic">
              {color.hex.toUpperCase()}
            </Text>
            {" · "}
            {t("combinations", { count: palettes.length })}
          </p>
        </Stack>
      }
    >
      {palettes.length === 0 ? (
        <Text italic tone="secondary" className="font-serif text-center py-8">
          {t("sheetEmpty")}
        </Text>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {palettes.map((p) => (
            <SheetPaletteRow key={p.id} palette={p} highlightHex={color.hex} />
          ))}
        </div>
      )}
    </Sheet>
  );
}

function SheetPaletteRow({
  palette,
  highlightHex,
}: {
  palette: Palette;
  highlightHex: string;
}) {
  const t = useTranslations("paleta");
  const hi = highlightHex.toLowerCase();
  const SWATCH = "w-16 sm:w-20";
  return (
    <article className="flex flex-col gap-3 py-6">
      <div className="flex items-baseline justify-end">
        <Text variant="caption" tabular>
          n{String(palette.id).padStart(3, "0")}
        </Text>
      </div>
      <div className="flex h-24 md:h-28">
        {palette.colors.map((c, i) => (
          <div
            key={i}
            className={`${SWATCH} shrink-0`}
            style={{ backgroundColor: c.hex }}
            title={c.name ?? c.hex}
          />
        ))}
      </div>
      <div className="flex">
        {palette.colors.map((c, i) => {
          const isHi = c.hex.toLowerCase() === hi;
          return (
            <div
              key={i}
              className={`${SWATCH} shrink-0 flex flex-col gap-0.5 pr-3`}
            >
              <span
                className={`font-serif type-small leading-tight ${
                  isHi ? "text-text-primary" : "text-text-secondary"
                }`}
              >
                {c.name ?? t("unnamed")}
              </span>
              <Text variant="mono" tone="secondary" as="span">
                {c.hex.toUpperCase()}
              </Text>
            </div>
          );
        })}
      </div>
    </article>
  );
}
