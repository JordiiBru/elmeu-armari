"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { SweaterMode } from "@/generated/prisma/enums";
import { setSweaterModeAction } from "@/app/armari/actions";
import { SegmentedControl, Text } from "@/components/ui";

const MODES: SweaterMode[] = ["AUTO", "ON", "OFF"];

/**
 * The manual override next to the season default: AUTO follows the
 * calendar (see `resolveSweaterInSeason`), ON/OFF ignores it until this
 * is touched again. Lives in the armari header because it decides how
 * combinations generated from a piece are ranked, not the wardrobe's
 * contents — nothing here filters the grid itself.
 */
export function SweaterModeToggle({ initialMode }: { initialMode: SweaterMode }) {
  const t = useTranslations("armari.sweaterMode");
  const [mode, setMode] = useState(initialMode);
  const [, startTransition] = useTransition();

  const handleChange = (next: SweaterMode) => {
    setMode(next);
    startTransition(async () => {
      await setSweaterModeAction(next);
    });
  };

  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <Text variant="caption" as="span">
        {t("label")}
      </Text>
      <SegmentedControl<SweaterMode>
        value={mode}
        onChange={handleChange}
        wrap={false}
        ariaLabel={t("label")}
        options={MODES.map((m) => ({ value: m, label: t(m) }))}
      />
      <Text variant="small" italic tone="secondary" className="font-serif basis-full">
        {t("hint")}
      </Text>
    </div>
  );
}
