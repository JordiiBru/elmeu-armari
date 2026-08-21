"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { UI } from "@/lib/prendas/ui-strings";
import { LaundryPicker } from "./LaundryPicker";
import { SegmentedControl, Stack, Text } from "@/components/ui";

type View = "clean" | "basket";

const VIEW_PARAM = "vista";
const VIEW_VALUE: Record<View, string> = { clean: "netes", basket: "cistell" };

/** Anything but the basket value is the clean pile: sending pieces to the
 * basket is the daily errand and emptying it a weekly one, so the bare URL
 * opens on the pile you reach for most. */
function parseView(value: string | null): View {
  return value === VIEW_VALUE.basket ? "basket" : "clean";
}

function countLabel(label: string, n: number) {
  return (
    <>
      {label}
      <span className="tabular-nums"> {n}</span>
    </>
  );
}

/**
 * The two laundry piles on one screen. Which one you are looking at is in
 * the URL because other screens point straight at the basket (a blocked
 * outfit is an errand, not a browse), but the switch itself is local: both
 * piles are already here, so changing pile should not cost a navigation.
 */
export function LaundryBoard({
  clean,
  basket,
}: {
  clean: GarmentWithColors[];
  basket: GarmentWithColors[];
}) {
  const initialParams = useSearchParams();
  const [view, setView] = useState<View>(() => parseView(initialParams.get(VIEW_PARAM)));

  const changeView = (next: View) => {
    setView(next);
    // Same idiom as the armari filters: the address follows the screen
    // without a navigation, so the pile stays shareable and "enrere" still
    // means the screen before this one, not the tab before this one.
    window.history.replaceState(
      null,
      "",
      next === "clean"
        ? window.location.pathname
        : `${window.location.pathname}?${VIEW_PARAM}=${VIEW_VALUE[next]}`,
    );
  };

  const copy = view === "clean" ? UI.bugaderia.picker.soil : UI.bugaderia.picker.wash;

  return (
    <Stack gap={5}>
      <Stack gap={2}>
        <SegmentedControl<View>
          value={view}
          onChange={changeView}
          ariaLabel={UI.bugaderia.viewsLabel}
          options={[
            { value: "clean", label: countLabel(UI.bugaderia.views.clean, clean.length) },
            { value: "basket", label: countLabel(UI.bugaderia.views.basket, basket.length) },
          ]}
          className="self-start"
        />
        <Text variant="small" italic tone="secondary">
          {copy.subtitle}
        </Text>
      </Stack>

      {/* Keyed on the view so the picker remounts and drops a selection
          belonging to the other pile. The entrance animation lives on the
          grid inside `LaundryPicker`, not here: `panel-enter` animates a
          transform, and an element with a filling transform animation is
          a containing block for `position: fixed` descendants — with it
          up here the picker's action bar stopped being pinned to the
          viewport and fell to the bottom of the document. */}
      <div key={view}>
        <LaundryPicker
          mode={view === "clean" ? "soil" : "wash"}
          garments={view === "clean" ? clean : basket}
        />
      </div>
    </Stack>
  );
}
