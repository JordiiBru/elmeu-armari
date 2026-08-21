"use client";

import { useRouter } from "next/navigation";
import type { GarmentWithColors } from "@/lib/prendas/types";
import type { SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import { GarmentModal } from "./GarmentModal";

/**
 * Thin route-driven wrapper around `GarmentModal`. Closing uses
 * `router.back()` — the only navigation that reliably resets the
 * `@modal` parallel slot back to `default.tsx`; `router.push`/`replace`
 * to `/armari` land on the right URL but leave the closed Sheet mounted
 * (confirmed empirically: 0 opacity, still `fixed inset-0 z-50`, still
 * eating every click on the page).
 *
 * `back()` itself isn't fully reliable though: `ArmariGrid` writes its
 * filter state via raw `window.history.replaceState` (to avoid a
 * server round-trip per filter click), which can desync the browser's
 * real history entries from Next's router-internal bookkeeping — and
 * `back()` on that desynced state can overshoot past `/armari` (observed:
 * straight to the home page). It always cleans up the modal correctly
 * regardless of where it lands, so just correct the destination
 * afterward if it went too far — by then the modal is already gone
 * either way, so a follow-up `replace` is safe.
 */
export function GarmentModalRoute({
  garment,
  allGarments,
  palettes,
  savedOutfitKeys,
  outfitsWith,
  extraCandidates,
  todayISO,
  todayOutfitId,
}: {
  garment: GarmentWithColors;
  allGarments: GarmentWithColors[];
  palettes: SanzoPalette[];
  savedOutfitKeys: string[];
  outfitsWith: SavedOutfit[];
  extraCandidates: GarmentWithColors[];
  todayISO: string;
  todayOutfitId: string | null;
}) {
  const router = useRouter();
  return (
    <GarmentModal
      garment={garment}
      allGarments={allGarments}
      palettes={palettes}
      savedOutfitKeys={savedOutfitKeys}
      outfitsWith={outfitsWith}
      extraCandidates={extraCandidates}
      todayISO={todayISO}
      todayOutfitId={todayOutfitId}
      onClose={() => {
        router.back();
        setTimeout(() => {
          if (!window.location.pathname.startsWith("/armari")) {
            router.replace("/armari");
          }
        }, 50);
      }}
    />
  );
}
