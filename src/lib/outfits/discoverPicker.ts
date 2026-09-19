import type { GarmentWithColors } from "@/lib/prendas/types";
import type { OutfitGroup } from "./types";

/**
 * The engine only ever checks three roles (hasTop, hasBottom, hasShoes),
 * and a top is satisfied by either a sweater or a shirt — never both at
 * once in the picker, even though the engine can still produce a rare
 * sweater+shirt layered group. Modelling by role rather than by the
 * four categories is what gives "start from pantalons, next is jersei
 * OR samarreta" for free: it's one row, not a branch.
 *
 * Pure and dependency-free on purpose: `DiscoverPicker.tsx` is where
 * this narrows a real wardrobe on a screen, but the narrowing and the
 * reopen-sweep are exactly the two places a real, hand-caught bug lived
 * this session (reopening a role positioned after the anchor in
 * `ROLE_ORDER` used to clear the anchor too) — worth being testable
 * without a DOM.
 */
export type Role = "TOP" | "PANTS" | "SHOES";
export const ROLE_ORDER: Role[] = ["TOP", "PANTS", "SHOES"];

export function roleOf(category: string): Role {
  if (category === "PANTS") return "PANTS";
  if (category === "SHOES") return "SHOES";
  return "TOP";
}

export type Picks = Partial<Record<Role, GarmentWithColors>>;

/** Every group in the universe still consistent with what's picked so
 * far — the picker's whole state machine is just this filter re-run on
 * every pick. */
export function narrowUniverse(universe: OutfitGroup[], picks: Picks): OutfitGroup[] {
  const pickedGarments = Object.values(picks) as (GarmentWithColors | undefined)[];
  return universe.filter((g) =>
    pickedGarments.every(
      (picked) => !picked || g.garments.some((gg) => gg.id === picked.id),
    ),
  );
}

/** The first role in the fixed top-to-bottom order that isn't picked
 * yet, or `null` once all three are. */
export function nextRole(picks: Picks): Role | null {
  return ROLE_ORDER.find((r) => !picks[r]) ?? null;
}

/** Every distinct garment of `role` across the still-alive groups —
 * this is what makes each offered option guaranteed reachable: it was
 * only ever collected because at least one group in `remaining` carries
 * it. */
export function optionsForRole(
  remaining: OutfitGroup[],
  role: Role,
): GarmentWithColors[] {
  const byId = new Map<string, GarmentWithColors>();
  for (const g of remaining) {
    for (const piece of g.garments) {
      if (roleOf(piece.category) === role) byId.set(piece.id, piece);
    }
  }
  return Array.from(byId.values());
}

/**
 * Reopening a step clears it and every step after it in `ROLE_ORDER` —
 * changing pantalons after sabates is already picked has to drop the
 * sabates pick too, since the new pantalons might not even combine with
 * it. Simplest correct rule: redoing at most two taps is cheap.
 *
 * The anchor is never in that sweep, whatever position it sits at in
 * `ROLE_ORDER`: it was chosen first, not in this flow's own top-to-
 * bottom order, so a role that only comes *after* it in `ROLE_ORDER` —
 * starting from pantalons, that's every other role — can still be
 * chronologically *before* it. Reopening "jersei o samarreta" after
 * starting from pantalons must not also clear the pantalons that
 * started the whole picker.
 */
export function reopenFrom(picks: Picks, role: Role, anchorRole: Role): Picks {
  const next = { ...picks };
  let clearing = false;
  for (const r of ROLE_ORDER) {
    if (r === role) clearing = true;
    if (clearing && r !== anchorRole) delete next[r];
  }
  return next;
}
