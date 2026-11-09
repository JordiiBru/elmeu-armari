"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { saveOutfitAction, setOutfitFavoriteAction } from "@/app/outfits/actions";
import type { PaletteMatch, SanzoPalette, SavedOutfit } from "@/lib/outfits/types";
import type { GarmentWithColors, Season } from "@/lib/prendas/types";
import { filterGarments, sortByWardrobeOrder } from "@/lib/prendas/filtering";
import { isDirty, isInSeason, isWearable } from "@/lib/bugaderia/laundry";
import { outfitKey } from "@/lib/outfits/key";
import { colourMatchesFor } from "@/lib/colors/matches";
import {
  EMPTY_PICKS,
  SLOTS,
  type Picks,
  type Slot,
  buildState,
  completingAccessories,
  isPicked,
  nextSlot,
  pickedPieces,
  picksFromOutfit,
  savedContaining,
  scoreOptions,
  slotOf,
  togglePick,
} from "@/lib/outfits/builder";
import { AccessoryGrid, BoxPiece, OutfitTile, paletteName, pieceTint } from "./OutfitTile";
import { OutfitSheet } from "./OutfitSheet";
import { PieceThumb } from "./PieceThumb";
import { Button, Grid, Icon, Stack, Text } from "@/components/ui";

type SingleSlot = Exclude<Slot, "ACCESSORIES">;
type View = "BUILD" | "SAVED" | "WEEK";
const VIEWS: View[] = ["BUILD", "SAVED", "WEEK"];

/**
 * "Què em poso?": build an outfit by hand and see its palette form, with
 * the outfits already saved underneath, narrowed by the same taps.
 *
 * One screen, no sheet to build in: the stage (the outfit as it is worn,
 * and its palette) and the pieces to try sit side by side on a desktop
 * and stacked on a phone. Every tap rescores every option against what
 * is already on, so where an outfit can still go is visible before
 * trying it: how many palettes a piece keeps open, which ones close
 * every palette (still offered, only quieter), and which accessories
 * bring in a colour of the palette the outfit does not wear yet.
 *
 * Saving keeps the accessories with the outfit: they are part of its
 * palette. Whether to put them on is decided on the day.
 */
export function OutfitStudio({
  garments,
  outfits,
  palettes,
  extraCandidates,
  savedOutfitKeys,
  todayISO,
  todayOutfitId,
  season,
  numbers,
  children,
}: {
  /** The whole wardrobe; outerwear is left out here. */
  garments: GarmentWithColors[];
  /** Every saved outfit, ranked for today; also what numbers them. */
  outfits: SavedOutfit[];
  palettes: SanzoPalette[];
  extraCandidates: GarmentWithColors[];
  savedOutfitKeys: string[];
  todayISO: string;
  todayOutfitId: string | null;
  season: Season;
  /** Catalogue number of every saved outfit, in the order it was saved. */
  numbers: Record<string, number>;
  /** What follows the collection on the page (the week): it scrolls
   * beside, or under, the pinned stage like the rest. */
  children?: React.ReactNode;
}) {
  const t = useTranslations("builder");
  const tOutfits = useTranslations("outfits");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [picks, setPicks] = useState<Picks>(EMPTY_PICKS);
  const [slot, setSlot] = useState<Slot>("TOP");
  const [view, setView] = useState<View>("BUILD");
  const [chosenPalette, setChosenPalette] = useState<number | null>(null);
  const [seasonOnly, setSeasonOnly] = useState(true);
  const [cleanOnly, setCleanOnly] = useState(true);
  // On while pieces are picked: the collection answers "what have I
  // already saved with these?". Off shows everything.
  const [withPicks, setWithPicks] = useState(true);
  const [openOutfitId, setOpenOutfitId] = useState<string | null>(null);
  const [savedHere, setSavedHere] = useState<string[]>([]);

  const stageRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // What sits pinned above the content: the whole stage band below lg,
  // the bar of view and slot tabs from lg (the stage is a column there).
  const barRef = useRef<HTMLDivElement>(null);
  const pinned = () => {
    const bar = barRef.current;
    return bar && bar.offsetParent !== null ? bar : stickyRef.current;
  };
  const [pinnedH, setPinnedH] = useState(0);
  useEffect(() => {
    const measure = () => setPinnedH(pinned()?.offsetHeight ?? 0);
    const ro = new ResizeObserver(measure);
    [stickyRef.current, barRef.current].forEach((e) => e && ro.observe(e));
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // From lg the stage is a column that never moves, so it is pinned at
  // the height that centres it in the screen below the header rather
  // than at the header itself: a screen of its own, not a block hanging
  // from the top with empty space under it. Below lg it is a band and
  // stays right under the header.
  const [stageStickTop, setStageStickTop] = useState<number | null>(null);
  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    const place = () => {
      const columnLayout = barRef.current?.offsetParent != null;
      if (!columnLayout) return setStageStickTop(null);
      const free = window.innerHeight - HEADER_H - el.offsetHeight;
      setStageStickTop(HEADER_H + Math.max(0, Math.round(free / 2)));
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    window.addEventListener("resize", place);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", place);
    };
  }, []);

  // Changing view or slot while scrolled down starts the new content at
  // its top, right under what is pinned, without animating: the old rows
  // are gone, so there is nothing to glide past.
  const toContentTop = () => {
    const content = contentRef.current;
    const sticky = pinned();
    if (!content || !sticky) return;
    const stuckBottom = sticky.getBoundingClientRect().bottom;
    const top = content.getBoundingClientRect().top;
    if (top < stuckBottom) window.scrollBy({ top: top - stuckBottom, behavior: "auto" });
  };
  const changeView = (next: View) => {
    setView(next);
    toContentTop();
  };
  // A box of the stage, or a slot tab: always about combining.
  const changeSlot = (next: Slot) => {
    setView("BUILD");
    setSlot(next);
    toContentTop();
  };

  // What can be tried: the toggles narrow the builder and the collection
  // alike, so "de temporada" never shows a look the builder could not.
  const pool = useMemo(
    () =>
      sortByWardrobeOrder(
        filterGarments(
          garments.filter((g) => slotOf(g.category) !== null),
          {
            categories: [],
            seasons: seasonOnly ? [season] : [],
            fits: [],
            textures: [],
            lengths: [],
            colors: [],
            states: cleanOnly ? ["clean"] : [],
            query: "",
          },
        ),
      ),
    [garments, seasonOnly, cleanOnly, season],
  );

  // The palette a loaded outfit was saved with, kept first only while its
  // clothes are all still on the stage: adding a bag to a saved look
  // does not swap its palette from under it, but swapping its trousers
  // makes it another outfit, judged by the engine from scratch. Kept
  // longer, it pinned a palette the new pieces do not share (grey jeans
  // shown as wearing its slate blue).
  const [loaded, setLoaded] = useState<{ paletteId: number; clothes: string[] } | null>(null);
  const savedPalette = useMemo(() => {
    if (!loaded) return null;
    const ids = new Set([picks.TOP, picks.PANTS, picks.SHOES].map((g) => g?.id));
    return loaded.clothes.every((id) => ids.has(id)) ? loaded.paletteId : null;
  }, [loaded, picks]);
  const state = useMemo(() => buildState(picks, palettes, savedPalette), [picks, palettes, savedPalette]);
  const match: PaletteMatch | undefined =
    state.matches.find((m) => m.palette.id === chosenPalette) ?? state.matches[0];

  const options = useMemo(
    () =>
      scoreOptions(
        pool.filter((g) => slotOf(g.category) === slot),
        picks,
        slot,
        palettes.length,
      ),
    [pool, picks, slot, palettes.length],
  );

  const completing = useMemo(
    () =>
      slot === "ACCESSORIES"
        ? completingAccessories(
            picks,
            match,
            options.map((o) => o.garment),
            palettes,
          )
        : new Set<string>(),
    [slot, picks, match, options, palettes],
  );
  // The order of a tab is fixed while you pick inside it: it is ranked
  // against the other slots only, so ticking a bag never reshuffles the
  // accessories under your finger. Captions and marks stay live. The
  // accessory that brings the palette's missing colour in leads, judged
  // on the clothes alone.
  const orderPicks = useMemo<Picks>(
    () => (slot === "ACCESSORIES" ? { ...picks, ACCESSORIES: [] } : picks),
    [slot, picks],
  );
  const shown = useMemo(() => {
    const candidates = pool.filter((g) => slotOf(g.category) === slot);
    const ranked = scoreOptions(candidates, orderPicks, slot, palettes.length).map((o) => o.garment.id);
    const leads =
      slot === "ACCESSORIES"
        ? completingAccessories(orderPicks, buildState(orderPicks, palettes).matches[0], candidates, palettes)
        : new Set<string>();
    const order = [...ranked.filter((id) => leads.has(id)), ...ranked.filter((id) => !leads.has(id))];
    const byId = new Map(options.map((o) => [o.garment.id, o]));
    return order.map((id) => byId.get(id)!).filter(Boolean);
  }, [pool, slot, orderPicks, palettes, options]);

  const pieces = pickedPieces(picks);
  const complete = state.missing.length === 0;
  const key = match ? outfitKey(pieces.map((g) => g.id), match.palette.id) : null;
  const savedKeys = useMemo(() => new Set([...savedOutfitKeys, ...savedHere]), [savedOutfitKeys, savedHere]);
  const existing = key
    ? (outfits.find((o) => outfitKey([...o.garments, ...o.accessories].map((g) => g.id), o.paletteId) === key) ??
      null)
    : null;
  const isSaved = key !== null && savedKeys.has(key);
  // The same pieces, saved under a palette the engine no longer leads
  // with (or one picked by hand): still yours, so it is offered to open.
  const pieceIds = pieces.map((g) => g.id).sort().join(",");
  const samePieces =
    existing ??
    (complete
      ? (outfits.find(
          (o) =>
            [...o.garments, ...o.accessories]
              .map((g) => g.id)
              .sort()
              .join(",") === pieceIds,
        ) ?? null)
      : null);

  const [flash, setFlash] = useState<{ text: string; id: number } | null>(null);
  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), FLASH_MS);
    return () => clearTimeout(timer);
  }, [flash]);

  const pick = (g: GarmentWithColors) => {
    const next = togglePick(picks, g);
    setPicks(next);
    setChosenPalette(null);
    // A refusal is about the outfit as it was; one tap later it is stale.
    setFlash(null);
    // The tab stays where it is: jumping to the next slot on every tap
    // swapped the whole grid under the finger and lost your place. The
    // empty boxes above already say what is left.
  };

  const clear = () => {
    setPicks(EMPTY_PICKS);
    setFlash(null);
    setChosenPalette(null);
    setLoaded(null);
    setSlot("TOP");
  };

  // Scrolled once the sheet has closed: its scroll lock restores the
  // page's position on unmount, and would undo a scroll made before.
  const scrollToStage = useRef(false);
  useEffect(() => {
    if (openOutfitId !== null || !scrollToStage.current) return;
    scrollToStage.current = false;
    stageRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  }, [openOutfitId]);

  const tryOutfit = (outfit: SavedOutfit) => {
    setPicks(picksFromOutfit(outfit));
    setChosenPalette(outfit.paletteId);
    {
      const p = picksFromOutfit(outfit);
      setLoaded({
        paletteId: outfit.paletteId,
        clothes: [p.TOP, p.PANTS, p.SHOES].flatMap((g) => (g ? [g.id] : [])),
      });
    }
    setSlot("ACCESSORIES");
    setView("BUILD");
    scrollToStage.current = true;
    setOpenOutfitId(null);
  };

  // What stops a save, said only when a save is tried: the stage itself
  // already shows what is missing, so nothing is spelled out until then.
  const blocker = (): string | null => {
    if (pieces.length === 0) return t("blocked.empty");
    if (!complete) {
      return t("blocked.missing", {
        pieces: state.missing.map((s) => t(`slots.${s}`)).join(tOutfits("piecesJoin")),
      });
    }
    if (!match) return state.open === 0 ? t("blocked.dead") : t("blocked.noPair");
    return null;
  };

  const save = () => {
    const reason = blocker();
    if (reason) {
      setFlash({ text: reason, id: Date.now() });
      return;
    }
    if (!match || !key) return;
    const ids = pieces.map((g) => g.id);
    const paletteId = match.palette.id;
    startTransition(async () => {
      await saveOutfitAction(paletteId, ids);
      setSavedHere((prev) => [...prev, key]);
      router.refresh();
    });
  };

  const toggleFavorite = (outfit: SavedOutfit) => {
    startTransition(async () => {
      await setOutfitFavoriteAction(outfit.id, !outfit.favorite);
    });
  };

  // The collection under the builder: what is saved with every piece on
  // the stage, through the same toggles.
  const saved = useMemo(
    () =>
      (withPicks ? savedContaining(outfits, picks) : outfits)
        .filter((o) => !seasonOnly || isInSeason(o, season))
        .filter((o) => !cleanOnly || isWearable(o)),
    [outfits, picks, withPicks, seasonOnly, season, cleanOnly],
  );
  const paletteMap = useMemo(() => new Map(palettes.map((p) => [p.id, p])), [palettes]);
  const openOutfit = outfits.find((o) => o.id === openOutfitId) ?? null;

  const slotLabel = (s: Slot) => t(`slots.${s}`);
  const viewLabel = (v: View) => t(`views.${v}`);
  const number = (o: SavedOutfit) => String(numbers[o.id] ?? 0).padStart(3, "0");
  // A saved outfit with these pieces, under this palette or another one.
  const mine = existing ?? samePieces;

  // Save and restart sit side by side at the foot of the stage, aligned
  // with the bottom of the boxes, and are always there: nothing that
  // comes or goes above them (a palette, its alternatives) moves them.
  // Once the outfit is saved its number takes the save's place, as the
  // way into it.
  const actions = (
    <div className="relative">
      <Flash flash={flash} className="inset-x-0 bottom-full mb-2 sm:right-auto" />
      <div className="grid grid-cols-1 gap-1 sm:flex sm:justify-start sm:gap-3 lg:grid lg:grid-cols-2 lg:gap-2">
        {isSaved && existing ? (
          <Button
            type="button"
            size="sm"
            onClick={() => setOpenOutfitId(existing.id)}
            aria-label={t("open", { number: number(existing) })}
            className="justify-center tabular-nums sm:min-w-[9.5rem]"
          >
            n{number(existing)}
            <Icon name="arrow-right" size={12} className="ml-2" />
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={save}
            disabled={pending}
            loading={pending}
            loadingText={t("saving")}
            className="justify-center sm:min-w-[9.5rem]"
          >
            {t("save")}
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={clear}
          disabled={pieces.length === 0 || pending}
          className="justify-center sm:min-w-[7.5rem]"
        >
          {t("clear")}
        </Button>
      </div>
    </div>
  );

  const stage = (
    <div className="flex min-w-0 items-stretch gap-4 sm:gap-8 lg:flex-col lg:gap-5">
      {/* Sized from the screen's height as well as its width: the stage
          stays pinned while the pieces scroll under it, so it must leave
          most of the screen to them. Square boxes, for the same reason. */}
      <div className="w-[max(46%,9.75rem)] max-w-[15rem] flex-shrink-0 sm:w-[clamp(13rem,30vh,20rem)] sm:max-w-none lg:w-full">
        <Figure picks={picks} active={slot} onSlot={changeSlot} label={slotLabel} prompt={(s) => t(`prompts.${s}`)} />
      </div>
      <div data-stage-side className="flex min-w-0 flex-1 flex-col gap-2 sm:gap-4 lg:flex-none">
        <PalettePanel
          pieces={pieces}
          match={match}
          matches={state.matches}
          onChoose={setChosenPalette}
          moreLabel={t("alternatives")}
          savedLink={
            mine && !(isSaved && existing) ? (
              <button
                type="button"
                onClick={() => setOpenOutfitId(mine.id)}
                className="font-serif italic type-small text-text-secondary underline decoration-border underline-offset-4 transition-colors hover:text-text-primary"
              >
                {t("savedAs", { number: number(mine) })}
              </button>
            ) : null
          }
        />
        {actions}
      </div>
    </div>
  );

  return (
    <Stack gap={9} className="md:gap-16">
      <Stack gap={6} className="md:gap-8">
        <div className="flex items-center gap-6">
          <FilterToggle on={seasonOnly} onToggle={() => setSeasonOnly((v) => !v)} label={tOutfits("seasonOnly")} />
          <FilterToggle on={cleanOnly} onToggle={() => setCleanOnly((v) => !v)} label={tOutfits("cleanOnly")} />
        </div>

        {/* The stage is pinned under the site header for the whole page:
            whatever the view below it shows, what you are building and its
            palette stay on screen. Below lg it is a band across the top
            with the view switch under it; from lg it is a column of its
            own, centred in the screen, and the view switch (plus the slot
            tabs while combining) rides over the right-hand column.

            The three views (combinar · desats · setmana) share the space
            instead of stacking: a short category no longer pulls the
            collection up under your finger, and the week is one tap away
            rather than a long scroll. */}
        <div
          ref={stageRef}
          className="min-w-0 scroll-mt-[84px] lg:grid lg:grid-cols-[var(--stage-w)_minmax(0,1fr)] lg:items-start lg:gap-12 xl:gap-16"
          style={{ ["--stage-w" as string]: "max(15rem, min(22rem, 26vw, calc(100svh - 84px - 20rem)))" }}
        >
          <div
            ref={stickyRef}
            data-stage
            style={stageStickTop !== null ? { top: stageStickTop } : undefined}
            className="sticky top-[84px] z-20 -mt-3 border-b border-border bg-background pt-3 lg:mt-0 lg:border-b-0 lg:pt-0"
          >
            {stage}
            <div className="mt-3 sm:mt-5 lg:hidden">
              <ViewTabs active={view} onView={changeView} label={viewLabel} ariaLabel={t("viewsAria")} />
            </div>
          </div>

          <div className="min-w-0">
            <div ref={barRef} className="sticky top-[84px] z-20 hidden bg-background lg:block">
              <ViewTabs active={view} onView={changeView} label={viewLabel} ariaLabel={t("viewsAria")} />
              {view === "BUILD" && (
                <div className="mt-1">
                  <SlotTabs active={slot} picks={picks} onSlot={changeSlot} label={slotLabel} ariaLabel={t("slotsAria")} />
                </div>
              )}
            </div>

            {/* At least one screen tall, whatever the view holds: a short
                view must not shrink the page and drag the scroll with it. */}
            <div
              ref={contentRef}
              className="pt-5"
              style={{ minHeight: pinnedH ? `calc(100svh - ${HEADER_H + pinnedH}px)` : undefined }}
            >
              {view === "BUILD" && (
                <div key="build">
                  {/* On a phone the four boxes above already switch slot;
                      the tabs are here too, at the top of the pieces, for
                      whoever reads the list before the boxes. */}
                  <div className="mb-5 -mt-1 lg:hidden">
                    <SlotTabs active={slot} picks={picks} onSlot={changeSlot} label={slotLabel} ariaLabel={t("slotsAria")} />
                  </div>
                {shown.length === 0 ? (
                  <Text italic tone="secondary" className="font-serif py-8">
                    {t("noOptions")}
                  </Text>
                ) : (
                  <div
                    key={slot}
                    // From sm the grid holds as many pieces of a fixed size
                    // as fit, instead of a column count that grew them with
                    // the screen: what matters is seeing many at once.
                    className="panel-enter grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] sm:gap-x-4 sm:gap-y-6"
                  >
                    {shown.map((o) => (
                      <OptionCard
                        key={o.garment.id}
                        garment={o.garment}
                        picked={isPicked(picks, o.garment)}
                        fits={o.fits}
                        completes={completing.has(o.garment.id)}
                        caption={
                          o.garment.colors.length === 0
                            ? t("noColour")
                            : !o.fits
                              ? t("noFit")
                              : o.wildcard || o.palettes === null
                                ? t("wildcard")
                                : t("palettes", { count: o.palettes })
                        }
                        marks={{ completes: t("completes"), dirty: tOutfits("inBasket") }}
                        onPick={() => pick(o.garment)}
                      />
                    ))}
                  </div>
                )}
                </div>
              )}

              {view === "SAVED" && (
                <Stack key="saved" gap={5} className="panel-enter">
                  {pieces.length > 0 && (
                    <div className="-mt-2 flex min-h-11 items-center justify-end">
                      <FilterToggle on={withPicks} onToggle={() => setWithPicks((v) => !v)} label={t("withPicks")} />
                    </div>
                  )}
              {saved.length === 0 ? (
                <Text italic tone="secondary" className="font-serif">
                  {outfits.length === 0
                    ? t("savedEmpty")
                    : pieces.length > 0 && withPicks
                      ? t("savedNoneWithPicks")
                      : tOutfits("axisEmpty")}
                </Text>
              ) : (
                <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] sm:gap-x-6">
                  {saved.map((outfit) => (
                    <OutfitTile
                      key={outfit.id}
                      outfit={outfit}
                      palette={paletteMap.get(outfit.paletteId) ?? null}
                      index={(numbers[outfit.id] ?? 1) - 1}
                      mark={outfit.id === todayOutfitId ? tOutfits("today") : null}
                      onOpen={() => setOpenOutfitId(outfit.id)}
                      onToggleFavorite={() => toggleFavorite(outfit)}
                    />
                  ))}
                </div>
              )}
                </Stack>
              )}

              {view === "WEEK" && (
                <div key="week" className="panel-enter">
                  {children}
                </div>
              )}
            </div>
          </div>
        </div>
      </Stack>

      {openOutfit && (
        <OutfitSheet
          outfit={openOutfit}
          palette={paletteMap.get(openOutfit.paletteId) ?? null}
          extraCandidates={extraCandidates}
          dayISO={todayISO}
          todayISO={todayISO}
          isCommitted={openOutfit.id === todayOutfitId}
          chooseDay
          allowDelete
          onTry={() => tryOutfit(openOutfit)}
          onClose={() => setOpenOutfitId(null)}
        />
      )}
    </Stack>
  );
}

/** The site header's height (pt-6 + h-11 + pb-4): where pinned things
 * start. */
const HEADER_H = 84;

/** How long a refused save explains itself before it goes quiet again. */
const FLASH_MS = 3200;

/** A line that appears beside the save button when a save is refused and
 * fades on its own. Absolutely placed: it never pushes the button or
 * anything under it. */
function Flash({ flash, className }: { flash: { text: string; id: number } | null; className: string }) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={`pointer-events-none absolute z-10 sm:w-max sm:max-w-[22rem] bg-elevated px-2 py-1 font-serif italic type-small text-text-primary transition-opacity duration-[var(--duration-base)] ${className} ${
        flash ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Keyed so the same reason, asked twice, is announced twice. */}
      <span key={flash?.id}>{flash?.text}</span>
    </p>
  );
}

/** One binary filter: a small square, filled when on, and its name. */
function FilterToggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className={`inline-flex min-h-11 items-center gap-2 type-caption transition-colors duration-[var(--duration-base)] ${
        on ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
      }`}
    >
      <span
        aria-hidden
        className={`inline-flex h-3.5 w-3.5 items-center justify-center border ${
          on ? "border-border-strong bg-text-primary text-background" : "border-border"
        }`}
      >
        {on && <Icon name="check" size={9} />}
      </span>
      {label}
    </button>
  );
}

/**
 * The outfit as four boxes of one size, two by two in reading order:
 * top, trousers, shoes, accessories. Equal boxes rather than a body's
 * proportions: every slot is something to tap and to see, and the
 * accessories box holds several pieces in its own small grid.
 */
function Figure({
  picks,
  active,
  onSlot,
  label,
  prompt,
}: {
  picks: Picks;
  active: Slot;
  onSlot: (s: Slot) => void;
  label: (s: Slot) => string;
  prompt: (s: Slot) => string;
}) {
  return (
    <div className="grid w-full grid-cols-2 gap-1.5 lg:gap-2">
      {SLOTS.map((s) => {
        const single = s === "ACCESSORIES" ? undefined : picks[s as SingleSlot];
        const filled = s === "ACCESSORIES" ? picks.ACCESSORIES.length > 0 : Boolean(single);
        return (
          <button
            key={s}
            type="button"
            onClick={() => onSlot(s)}
            aria-label={single ? `${label(s)}: ${pieceTint(single) ?? ""}` : prompt(s)}
            aria-pressed={active === s}
            className={`group relative aspect-square w-full overflow-hidden bg-surface outline-none transition-shadow duration-[var(--duration-base)] focus-visible:ring-1 focus-visible:ring-focus-ring ${
              active === s ? "ring-1 ring-border-strong ring-inset" : ""
            }`}
          >
            {!filled ? (
              <EmptySlot text={prompt(s)} quiet={s === "ACCESSORIES"} />
            ) : single ? (
              <BoxPiece garment={single} thumb={false} sizes="(min-width: 1024px) 14rem, 28vw" />
            ) : (
              <AccessoryGrid pieces={picks.ACCESSORIES} sizes="7rem" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function EmptySlot({ text, quiet = false }: { text: string; quiet?: boolean }) {
  return (
    <span
      className={`absolute inset-0 flex items-center justify-center border border-dashed px-1 text-center font-serif italic type-small leading-tight max-sm:text-[0.7rem] transition-colors group-hover:text-text-primary ${
        quiet ? "border-border-subtle text-text-muted" : "border-border text-text-secondary"
      }`}
    >
      {text}
    </span>
  );
}

/** The palette named by the colours the outfit actually wears, then the
 * rest: naming it by its first two colours put an unworn yellow first
 * on an outfit of brown and blue. */
function wornPaletteName(match: PaletteMatch): string | null {
  const worn = new Set(match.colorAssignments.map((a) => a.paletteColorIndex));
  const order = match.palette.colores
    .map((_, i) => i)
    .sort((a, b) => Number(worn.has(b)) - Number(worn.has(a)) || a - b);
  return paletteName({ ...match.palette, colores: order.map((i) => match.palette.colores[i]) });
}

/**
 * The palette the pieces on the stage are worn in, as it forms. Colours
 * the outfit already wears stand full height; the ones it does not wear
 * yet sit low, so what is missing reads at a glance. Every line keeps its
 * height whether it has content or not, so the actions under the name
 * never move; the alternatives go last, where their coming and going
 * shifts nothing.
 */
function PalettePanel({
  pieces,
  match,
  matches,
  onChoose,
  moreLabel,
  savedLink,
}: {
  pieces: GarmentWithColors[];
  match: PaletteMatch | undefined;
  matches: PaletteMatch[];
  onChoose: (id: number) => void;
  moreLabel: string;
  /** The same pieces saved under another palette, to open it. */
  savedLink: React.ReactNode;
}) {
  const worn = new Set(match?.colorAssignments.map((a) => a.paletteColorIndex) ?? []);
  // Before two pieces share a palette, the strip is the Sanzo colours the
  // pieces on the stage are read as, with room for what comes.
  const anchors = match
    ? []
    : [
        ...new Map(
          colourMatchesFor(pieces.flatMap((g) => g.colors.map((c) => c.hex))).flatMap((m) =>
            m.anchor ? [[m.anchor.hex, m.anchor] as const] : [],
          ),
        ).values(),
      ].slice(0, 5);
  const alternatives = match ? matches.filter((m) => m.palette.id !== match.palette.id) : [];
  return (
    <div className="flex flex-1 flex-col gap-2 sm:gap-4">
      <div className="flex h-8 w-full items-end gap-1 sm:h-14" title={match?.palette.nombre}>
        {match
          ? match.palette.colores.map((hex, i) => (
              <span
                key={`${match.palette.id}-${i}`}
                className={`flex-1 transition-[height] duration-[var(--duration-slow)] ease-[var(--ease-standard)] motion-reduce:transition-none ${
                  worn.has(i) ? "h-full" : "h-1/3"
                }`}
                style={{ backgroundColor: hex }}
              />
            ))
          : [
              ...anchors.map((a) => (
                <span key={a.hex} title={a.name} className="h-full flex-1" style={{ backgroundColor: a.hex }} />
              )),
              ...Array.from({ length: Math.max(1, 4 - anchors.length) }, (_, i) => (
                <span key={`empty-${i}`} className="h-1/4 flex-1 bg-border-subtle" />
              )),
            ]}
      </div>
      {/* One line, reserved even when empty: the buttons under it must
          not move as names come and go. */}
      <div className="flex min-h-5 items-baseline justify-between gap-3 sm:min-h-7">
        <Text as="span" className="min-w-0 truncate font-serif lowercase leading-tight max-sm:type-small lg:type-subtitle">
          {match ? wornPaletteName(match) : "\u00a0"}
        </Text>
        {match && (
          <Text variant="caption" tabular className="hidden flex-shrink-0 lg:inline">
            {match.palette.nombre}
          </Text>
        )}
        {/* Below lg there is no room for the row of alternatives without
            pushing the buttons down, so the palette itself steps through
            them: "2/5 ›" says there are more, and a tap shows the next. */}
        {match && matches.length > 1 && (
          <button
            type="button"
            onClick={() => {
              const i = matches.findIndex((m) => m.palette.id === match.palette.id);
              onChoose(matches[(i + 1) % matches.length].palette.id);
            }}
            aria-label={moreLabel}
            className="-my-3 inline-flex min-h-11 flex-shrink-0 items-center gap-0.5 type-caption tabular-nums text-text-secondary transition-colors hover:text-text-primary lg:hidden"
          >
            {matches.findIndex((m) => m.palette.id === match.palette.id) + 1}/{matches.length}
            <Icon name="chevron-right" size={10} />
          </button>
        )}
      </div>
      {/* Alternatives and the "saved as" line take whatever room is left
          above the buttons and never more: on a phone they would
          otherwise push the buttons down. */}
      <div className="flex min-h-0 flex-1 basis-0 flex-col gap-3 overflow-hidden lg:flex-none lg:basis-auto">
      {alternatives.length > 0 && (
        <div className="hidden flex-wrap items-center gap-3 lg:flex">
          <Text variant="caption" tone="secondary" as="span">
            {moreLabel}
          </Text>
          {alternatives.map((m) => (
            <button
              key={m.palette.id}
              type="button"
              onClick={() => onChoose(m.palette.id)}
              aria-label={m.palette.nombre}
              title={m.palette.nombre}
              className="flex h-3 w-12 overflow-hidden outline-none ring-offset-2 ring-offset-background transition-opacity hover:opacity-80 focus-visible:ring-1 focus-visible:ring-focus-ring sm:w-14"
            >
              {m.palette.colores.map((hex, i) => (
                <span key={i} className="flex-1" style={{ backgroundColor: hex }} />
              ))}
            </button>
          ))}
        </div>
      )}
      {savedLink}
      </div>
    </div>
  );
}


/** The three views beside the stage. Set in the serif, larger than the
 * slot tabs under it, so the two rows read as a section and its parts. */
function ViewTabs({
  active,
  onView,
  label,
  ariaLabel,
}: {
  active: View;
  onView: (v: View) => void;
  label: (v: View) => string;
  ariaLabel: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="grid grid-cols-3 border-b border-border">
      {VIEWS.map((v) => (
        <button
          key={v}
          type="button"
          role="tab"
          aria-selected={active === v}
          onClick={() => onView(v)}
          className={`-mb-px flex min-h-11 items-center justify-center whitespace-nowrap border-b font-serif lowercase type-body transition-colors duration-[var(--duration-base)] lg:type-subtitle ${
            active === v
              ? "border-border-strong text-text-primary"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          {label(v)}
        </button>
      ))}
    </div>
  );
}

function SlotTabs({
  active,
  picks,
  onSlot,
  label,
  ariaLabel,
}: {
  active: Slot;
  picks: Picks;
  onSlot: (s: Slot) => void;
  label: (s: Slot) => string;
  ariaLabel: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex justify-between gap-3 border-b border-border sm:grid sm:grid-cols-4 sm:gap-0">
      {SLOTS.map((s) => {
        const filled = s === "ACCESSORIES" ? picks.ACCESSORIES.length : picks[s] ? 1 : 0;
        return (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={active === s}
            onClick={() => onSlot(s)}
            className={`-mb-px flex min-h-11 items-center justify-center gap-1 whitespace-nowrap border-b type-caption max-sm:tracking-[0.06em] sm:gap-1.5 sm:px-1 transition-colors duration-[var(--duration-base)] ${
              active === s
                ? "border-border-strong text-text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            <span>{label(s)}</span>
            {filled > 0 &&
              (s === "ACCESSORIES" ? (
                <span aria-hidden className="tabular-nums text-text-primary">
                  {filled}
                </span>
              ) : (
                <span aria-hidden className="h-1 w-1 rounded-full bg-text-primary" />
              ))}
          </button>
        );
      })}
    </div>
  );
}

function OptionCard({
  garment,
  picked,
  fits,
  completes,
  caption,
  marks,
  onPick,
}: {
  garment: GarmentWithColors;
  picked: boolean;
  fits: boolean;
  completes: boolean;
  caption: string;
  marks: { completes: string; dirty: string };
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={picked}
      className={`group flex min-w-0 flex-col text-left outline-none focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-opacity duration-[var(--duration-base)] ${
        fits || picked ? "" : "opacity-40 hover:opacity-70"
      }`}
    >
      <span
        className={`relative block aspect-[3/4] w-full overflow-hidden transition-[box-shadow] ${
          picked ? "ring-1 ring-border-strong ring-offset-2 ring-offset-background" : ""
        }`}
      >
        <PieceThumb
          garment={garment}
          thumb
          sizes="(min-width: 1280px) 10vw, (min-width: 640px) 14vw, 30vw"
          className="h-full w-full transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)] group-hover:scale-[1.02]"
        />
        {picked && (
          <span className="absolute top-1.5 right-1.5 inline-flex bg-elevated p-1 text-text-primary">
            <Icon name="check" size={12} />
          </span>
        )}
        {completes && (
          <span className="absolute top-1.5 left-1.5 type-caption bg-elevated px-1.5 py-0.5">{marks.completes}</span>
        )}
        {isDirty(garment) && (
          <span className="absolute bottom-1.5 left-1.5 type-caption bg-elevated px-1.5 py-0.5">{marks.dirty}</span>
        )}
      </span>
      <span className="mt-2 block truncate font-serif type-small lowercase">{pieceTint(garment) ?? "—"}</span>
      <span className="type-caption tabular-nums text-text-secondary">{caption}</span>
    </button>
  );
}
