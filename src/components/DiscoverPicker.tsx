"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { GarmentWithColors, Season } from "@/lib/prendas/types";
import type { OutfitGroup, SanzoPalette } from "@/lib/outfits/types";
import { generateOutfitGroupsForGarment } from "@/lib/outfits/engine";
import { filterGarments } from "@/lib/prendas/filtering";
import { isDirty } from "@/lib/bugaderia/laundry";
import { outfitKey } from "@/lib/outfits/key";
import { saveOutfitAction } from "@/app/outfits/actions";
import { optionLabel } from "@/lib/prendas/labels";
import { pieceTint } from "./OutfitTile";
import { OutfitGroupCard } from "./OutfitCard";
import { PieceThumb } from "./PieceThumb";
import { Sheet, Stack, Text, TextButton, Icon } from "@/components/ui";

// The engine only ever checks three roles (hasTop, hasBottom, hasShoes),
// and a top is satisfied by either a sweater or a shirt — never both at
// once in the picker, even though the engine can still produce a rare
// sweater+shirt layered group. Modelling by role rather than by the four
// categories is what gives "start from pantalons, next is jersei OR
// samarreta" for free: it's one row, not a branch.
type Role = "TOP" | "PANTS" | "SHOES";
const ROLE_ORDER: Role[] = ["TOP", "PANTS", "SHOES"];
function roleOf(category: string): Role {
  if (category === "PANTS") return "PANTS";
  if (category === "SHOES") return "SHOES";
  return "TOP";
}

// Plenty above the engine's own MAX_GROUPS=60 cap — this just needs to
// come back with "everything the engine is willing to rank for this
// piece" in one call, the same way OutfitBottomSheet's "veure totes"
// already does.
const UNIVERSE_LIMIT = 500;

interface Props {
  garment: GarmentWithColors;
  allGarments: GarmentWithColors[];
  palettes: SanzoPalette[];
  savedOutfitKeys: string[];
  onOutfitSaved: (key: string) => void;
  onBack?: () => void;
  onClose: () => void;
  sweaterInSeason: boolean;
  shortsInSeason: boolean;
  /** Same toggles "descobreix" itself reads, so a step's options sort
   * clean-and-in-season first rather than restarting the exploration
   * with its own separate filter state. */
  seasonOnly: boolean;
  cleanOnly: boolean;
  season: Season;
  skipEnter?: boolean;
}

/**
 * A three-tap picker rather than a scroll through up to 60 finished
 * cards: pick the top (or skip straight to pantalons if that's what you
 * opened), then pantalons, then sabates — each row narrowed to what
 * still colour-matches everything already picked, until exactly one
 * combination is left standing.
 *
 * Every option offered is guaranteed to lead somewhere: it was only
 * ever surfaced because at least one still-alive group in the universe
 * carries it, so no tap can walk into a dead end. Season and clean
 * state sort a row rather than filter it, for the same reason — a hard
 * filter could in principle zero out a step's whole row, which the flat
 * list this replaces never risked.
 */
export function DiscoverPicker({
  garment,
  allGarments,
  palettes,
  savedOutfitKeys,
  onOutfitSaved,
  onBack,
  onClose,
  sweaterInSeason,
  shortsInSeason,
  seasonOnly,
  cleanOnly,
  season,
  skipEnter,
}: Props) {
  const t = useTranslations("combine");
  const tLabel = useTranslations("labels");
  const tOutfits = useTranslations("outfits");
  const [pending, startTransition] = useTransition();

  // Computed once, off the piece the sheet opened on — never refetched
  // as picks narrow it, since narrowing is just filtering this same list.
  const [universe] = useState<OutfitGroup[]>(() => {
    const { groups } = generateOutfitGroupsForGarment(
      garment,
      allGarments,
      palettes,
      UNIVERSE_LIMIT,
      0,
      sweaterInSeason,
      shortsInSeason,
    );
    // Three pieces only: the rare sweater+shirt layered four-piece group
    // stays out of the picker's mental model of "top, pantalons, sabates"
    // — /armari's own combine sheet still surfaces those.
    return groups.filter((g) => g.garments.length === 3);
  });

  const anchorRole = roleOf(garment.category);
  const [picks, setPicks] = useState<Partial<Record<Role, GarmentWithColors>>>({
    [anchorRole]: garment,
  });
  const [savedHere, setSavedHere] = useState<string[]>([]);

  const remaining = useMemo(
    () =>
      universe.filter((g) =>
        (Object.values(picks) as (GarmentWithColors | undefined)[]).every(
          (picked) => !picked || g.garments.some((gg) => gg.id === picked.id),
        ),
      ),
    [universe, picks],
  );

  const nextRole = ROLE_ORDER.find((r) => !picks[r]) ?? null;

  const nextOptions = useMemo(() => {
    if (!nextRole) return [];
    const byId = new Map<string, GarmentWithColors>();
    for (const g of remaining) {
      for (const piece of g.garments) {
        if (roleOf(piece.category) === nextRole) byId.set(piece.id, piece);
      }
    }
    const options = Array.from(byId.values());
    // Season sinks (never hides) via the same helper the rail uses.
    // Clean is sorted, not filtered, here specifically: this row's own
    // invariant is that every option is reachable, and a hard clean
    // filter could zero one out.
    const seasoned = filterGarments(options, {
      categories: [],
      seasons: seasonOnly ? [season] : [],
      fits: [],
      textures: [],
      lengths: [],
      colors: [],
      states: [],
      query: "",
    });
    if (!cleanOnly) return seasoned;
    const clean = seasoned.filter((g) => !isDirty(g));
    const dirty = seasoned.filter((g) => isDirty(g));
    return [...clean, ...dirty];
  }, [remaining, nextRole, seasonOnly, season, cleanOnly]);

  const finishedGroup = nextRole === null ? (remaining[0] ?? null) : null;

  const pickFor = (role: Role, piece: GarmentWithColors) => {
    setPicks((prev) => ({ ...prev, [role]: piece }));
  };

  // Reopening a step clears it and every step after it in ROLE_ORDER —
  // changing pantalons after sabates is already picked has to drop the
  // sabates pick too, since the new pantalons might not even combine
  // with it. Simplest correct rule: redoing at most two taps is cheap.
  //
  // The anchor is never in that sweep, whatever position it sits at in
  // ROLE_ORDER: it was chosen first, not in this flow's own top-to-
  // bottom order, so a role that only comes after it in ROLE_ORDER —
  // starting from pantalons, that's every other role — can still be
  // chronologically *before* it. Reopening "jersei o samarreta" after
  // starting from pantalons must not also clear the pantalons that
  // started the whole picker.
  const reopen = (role: Role) => {
    setPicks((prev) => {
      const next = { ...prev };
      let clearing = false;
      for (const r of ROLE_ORDER) {
        if (r === role) clearing = true;
        if (clearing && r !== anchorRole) delete next[r];
      }
      return next;
    });
  };

  const handleSave = (paletteId: number) => {
    if (!finishedGroup) return;
    const garmentIds = finishedGroup.garments.map((g) => g.id);
    const key = outfitKey(garmentIds, paletteId);
    startTransition(async () => {
      await saveOutfitAction(paletteId, garmentIds);
      setSavedHere((prev) => [...prev, key]);
      onOutfitSaved(key);
    });
  };

  const savedPaletteIds = useMemo(() => {
    const ids = new Set<number>();
    if (!finishedGroup) return ids;
    const garmentIds = finishedGroup.garments.map((g) => g.id);
    for (const pm of finishedGroup.palettes) {
      const key = outfitKey(garmentIds, pm.palette.id);
      if (savedOutfitKeys.includes(key) || savedHere.includes(key)) ids.add(pm.palette.id);
    }
    return ids;
  }, [finishedGroup, savedOutfitKeys, savedHere]);

  const rowHeading: Record<Role, string> = {
    TOP: t("pickTop"),
    PANTS: t("pickPants"),
    SHOES: t("pickShoes"),
  };

  return (
    <Sheet
      onClose={onClose}
      size="xl"
      fill
      skipEnter={skipEnter}
      label={t("sheetLabel", { category: tLabel(`category.${garment.category}`) })}
      media={
        <div className="flex h-full w-full">
          {garment.colors.map((c) => (
            <div key={c.id} className="flex-1" style={{ backgroundColor: c.hex }} title={c.hex} />
          ))}
        </div>
      }
      mediaHeight="h-24 sm:h-32"
      header={
        <div className="flex items-start justify-between gap-3">
          <Stack gap={1}>
            <Text variant="caption">{t("eyebrow")}</Text>
            <h2 className="type-title leading-tight">{tLabel(`category.${garment.category}`)}</h2>
            <Text variant="small" italic tone="secondary" className="font-serif">
              {[garment.fit ? optionLabel(tLabel, "fit", garment.fit) : null, pieceTint(garment)]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </Stack>
          {onBack && (
            <TextButton type="button" tone="secondary" onClick={onBack}>
              {tOutfits("back")}
            </TextButton>
          )}
        </div>
      }
    >
      {universe.length === 0 ? (
        <Text italic tone="secondary" className="font-serif text-center py-8">
          {t("empty")}
        </Text>
      ) : (
        <Stack gap={7}>
          {ROLE_ORDER.map((role) => {
            const picked = picks[role];
            if (picked) {
              return (
                <ConfirmedPick
                  key={role}
                  garment={picked}
                  editable={role !== anchorRole}
                  onReopen={() => reopen(role)}
                  categoryLabel={tLabel(`category.${picked.category}`)}
                />
              );
            }
            if (role !== nextRole) return null;
            return (
              <div key={role} className="panel-enter">
                <OptionRow
                  heading={rowHeading[role]}
                  options={nextOptions}
                  onPick={(g) => pickFor(role, g)}
                  categoryLabel={(g) => tLabel(`category.${g.category}`)}
                />
              </div>
            );
          })}

          {finishedGroup && (
            <div className="panel-enter">
              <OutfitGroupCard
                group={finishedGroup}
                onSave={handleSave}
                savedPaletteIds={savedPaletteIds}
                pending={pending}
              />
            </div>
          )}
        </Stack>
      )}
    </Sheet>
  );
}

function ConfirmedPick({
  garment,
  editable,
  onReopen,
  categoryLabel,
}: {
  garment: GarmentWithColors;
  editable: boolean;
  onReopen: () => void;
  categoryLabel: string;
}) {
  const content = (
    <>
      <PieceThumb garment={garment} thumb sizes="40px" className="h-10 w-10 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <Text variant="caption" tone="secondary" as="div">
          {categoryLabel}
        </Text>
        <Text as="span" className="truncate font-serif lowercase">
          {pieceTint(garment)}
        </Text>
      </div>
    </>
  );

  if (!editable) {
    return <div className="flex min-h-11 items-center gap-3">{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onReopen}
      className="group flex min-h-11 w-full items-center gap-3 text-left outline-none focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {content}
      <Icon
        name="chevron-down"
        size={14}
        className="flex-shrink-0 text-text-secondary transition-colors group-hover:text-text-primary"
      />
    </button>
  );
}

function OptionRow({
  heading,
  options,
  onPick,
  categoryLabel,
}: {
  heading: string;
  options: GarmentWithColors[];
  onPick: (g: GarmentWithColors) => void;
  categoryLabel: (g: GarmentWithColors) => string;
}) {
  return (
    <Stack gap={3}>
      <Text variant="small" italic tone="secondary" className="font-serif">
        {heading}
      </Text>
      {/* Horizontal, not a wrapping grid: this is what keeps the sheet's
          height independent of how many options a step has — two shoes
          and twenty shoes both cost the same vertical space. */}
      <div className="flex gap-4 overflow-x-auto pb-1">
        {options.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => onPick(g)}
            className={`flex flex-shrink-0 flex-col items-center gap-1.5 outline-none focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              isDirty(g) ? "opacity-50" : ""
            }`}
          >
            <PieceThumb garment={g} thumb sizes="80px" className="h-20 w-20" />
            <Text variant="caption" className="w-20 text-center leading-tight">
              {categoryLabel(g)}
            </Text>
          </button>
        ))}
      </div>
    </Stack>
  );
}
