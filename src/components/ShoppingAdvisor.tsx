"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { Category, GarmentWithColors } from "@/lib/prendas/types";
import type { SanzoPalette } from "@/lib/outfits/types";
import { anchorFor } from "@/lib/outfits/engine";
import { suggestColours } from "@/lib/colors/from-photo";
import {
  assessColour,
  candidateColours,
  rankRecommendations,
  wardrobeReach,
  CANDIDATE_ID,
  SHOPPING_CATEGORIES,
  type Assessment,
  type Example,
  type ShoppingCategory,
  type WardrobeReach,
} from "@/lib/outfits/shopping";
import { ColourStrip } from "./ColourStrip";
import { PieceThumb } from "./PieceThumb";
import { pieceLabel } from "./OutfitTile";
import { Button, Heading, Icon, SegmentedControl, Stack, Text, TextButton } from "@/components/ui";

type Mode = "suggest" | "check";

/** Recommendations shown at first, and added per "veure'n més". */
const PAGE = 6;
/** Colours assessed per tick: small enough that a phone keeps scrolling
 * while the list is worked out (a category is about a second of engine). */
const BATCH = 6;
/** Where the native picker opens: a mid grey, neither of the two colours
 * a garment most often is. */
const PICKER_START = "#808080";
/** Pieces of a look: a wrapping grid sized to the screen, never a
 * horizontal scroller, and small enough on a desktop to read as a row. */
/** How a look is worn, from the top down: a sweater goes over the shirt. */
const BODY_ORDER: Category[] = ["OUTERWEAR", "SWEATER", "SHIRT", "PANTS", "SHOES", "ACCESSORI"];
const PIECE_GRID = "grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8";

/** A form or result section: a serif title over a strong rule, so it
 * never reads like the small-caps labels of the options inside it. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack as="section" gap={5}>
      <div className="border-b border-border-strong pb-3">
        <Heading level="title" as="h2">
          {title}
        </Heading>
      </div>
      {children}
    </Stack>
  );
}

/** A palette as a band of flat colour, thick enough to read as a printed
 * swatch, with a hairline under the colour the new piece is worn as. */
function PaletteStrip({
  palette,
  mark,
  className = "",
}: {
  palette: SanzoPalette;
  mark?: number | null;
  className?: string;
}) {
  return (
    <div aria-hidden className={`flex ${className}`}>
      {palette.colores.map((hex, i) => (
        <span key={i} className="flex flex-1 flex-col gap-1">
          <span className="block h-4" style={{ backgroundColor: hex }} />
          <span className={`block h-0.5 ${i === mark ? "bg-text-primary" : ""}`} />
        </span>
      ))}
    </div>
  );
}

/** The piece that does not exist yet: its colour, in the frame a photo
 * would have. */
function CandidateTile({ hex, label }: { hex: string; label: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      className="block aspect-[3/4] w-full border border-border-strong"
      style={{ backgroundColor: hex }}
    />
  );
}

function Thumb({ garment }: { garment: GarmentWithColors }) {
  const tLabels = useTranslations("labels");
  // The photo is decorative (alt=""), so the piece is named here.
  return (
    <span role="img" aria-label={pieceLabel(tLabels, garment)} className="block">
      <PieceThumb
        garment={garment}
        thumb
        loading="lazy"
        sizes="96px"
        className="aspect-[3/4] w-full border border-border"
      />
    </span>
  );
}

/** The numbers that decide, on one line: "+13 paletes · 21/28 peces". */
function Stats({ a, className = "" }: { a: Assessment; className?: string }) {
  const t = useTranslations("compra");
  return (
    <Text variant="small" tone="secondary" tabular as="p" className={className}>
      {t("stats", { fresh: a.newPalettes.length, partners: a.partners.length, pool: a.partnerPool })}
    </Text>
  );
}

function Recommendation({ a, n, onLook }: { a: Assessment; n: number; onLook: () => void }) {
  const t = useTranslations("compra");
  return (
    // The section's own rule already sits above the first row.
    <li className="flex min-w-0 flex-col gap-4 border-t border-border-strong pt-5 first:border-t-0 first:pt-0 md:nth-2:border-t-0 md:nth-2:pt-0">
      <button
        type="button"
        onClick={onLook}
        className="flex items-center gap-4 text-left outline-none focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      >
        <span
          aria-hidden
          className="block h-14 w-14 flex-shrink-0 border border-border"
          style={{ backgroundColor: a.hex }}
        />
        <Stack gap={1} className="min-w-0">
          <Text variant="caption" tone="secondary" tabular as="p">
            {String(n).padStart(2, "0")} · {t(`family.${a.family}`)}
          </Text>
          <Text as="h3" className="font-serif text-lg leading-snug break-words">
            {a.name ?? a.hex.toUpperCase()}
          </Text>
        </Stack>
      </button>
      <Stats a={a} />
      {/* A preview of the detail: its first three looks, by palette, and the
          coloured pieces they are built on. */}
      <Stack gap={2}>
        {a.examples.slice(0, 3).map((ex) => (
          <PaletteStrip key={ex.palette.id} palette={ex.palette} mark={ex.candidateIndex} className="w-full" />
        ))}
      </Stack>
      <ul className="grid grid-cols-6 gap-2">
        {a.featured.slice(0, 6).map((g) => (
          <li key={g.id} className="min-w-0">
            <Thumb garment={g} />
          </li>
        ))}
      </ul>
      <TextButton type="button" onClick={onLook} className="min-h-11 items-center gap-2 self-end">
        {t("suggest.look")}
        <Icon name="arrow-right" size={14} />
      </TextButton>
    </li>
  );
}

function OutfitRow({ example, hex }: { example: Example; hex: string }) {
  const t = useTranslations("compra");
  // Head to toe, the new piece in its own place among them.
  const pieces = [...example.group.garments].sort(
    (a, b) => BODY_ORDER.indexOf(a.category) - BODY_ORDER.indexOf(b.category),
  );
  return (
    <li className="flex min-w-0 flex-col gap-3">
      <div className="flex items-start gap-4">
        <PaletteStrip palette={example.palette} mark={example.candidateIndex} className="w-full max-w-64" />
        {example.fresh && (
          <Text variant="caption" as="span" className="flex-shrink-0">
            {t("newBadge")}
          </Text>
        )}
      </div>
      <ul className={PIECE_GRID}>
        {pieces.map((g) => (
          <li key={g.id} className="min-w-0">
            {g.id === CANDIDATE_ID ? (
              <CandidateTile hex={hex} label={t("candidate")} />
            ) : (
              <Thumb garment={g} />
            )}
          </li>
        ))}
      </ul>
    </li>
  );
}

function Verdict({ a }: { a: Assessment }) {
  const t = useTranslations("compra");
  return (
    <Stack gap={7}>
      <Stack as="header" gap={3} align="center" className="border-y border-border-strong py-10 text-center">
        <Heading level="hero" as="h3" className="text-balance">
          {t(`verdict.${a.verdict}`)}
        </Heading>
        <Stats a={a} />
        {(!a.name || !a.wearable) && (
          <Text variant="small" italic tone="secondary" as="p">
            {a.name ? t("unusual") : t("outside")}
          </Text>
        )}
      </Stack>

      {a.duplicates.length > 0 && (
        <Stack gap={3}>
          <Text variant="caption" tone="secondary" as="p">
            {t("owned", { count: a.duplicates.length })}
          </Text>
          <ul className={PIECE_GRID}>
            {a.duplicates.map((g) => (
              <li key={g.id} className="min-w-0">
                <Thumb garment={g} />
              </li>
            ))}
          </ul>
        </Stack>
      )}

      {a.examples.length > 0 && (
        <Stack gap={3}>
          <Text variant="caption" tone="secondary" as="p">
            {t("outfits")}
          </Text>
          <ol className="flex flex-col gap-8">
            {a.examples.map((ex) => (
              <OutfitRow key={ex.palette.id} example={ex} hex={a.hex} />
            ))}
          </ol>
        </Stack>
      )}
    </Stack>
  );
}

function ColourInput({
  hex,
  onChange,
}: {
  hex: string | null;
  onChange: (hex: string) => void;
}) {
  const t = useTranslations("compra.check");
  const [offered, setOffered] = useState<string[] | null>(null);

  const fromPhoto = async (file: File | undefined) => {
    if (!file) return;
    const found = await suggestColours(file);
    setOffered(found);
    if (found[0]) onChange(found[0]);
  };

  return (
    <Stack gap={4}>
      <div className="flex items-center gap-4">
        {/* The swatch is the picker: one tap opens the native one. */}
        <label
          className="relative h-14 w-20 flex-shrink-0 cursor-pointer overflow-hidden border border-border transition-colors hover:border-text-primary"
          style={{ backgroundColor: hex ?? "transparent" }}
        >
          <span className="sr-only">{t("pick")}</span>
          <input
            type="color"
            value={hex ?? PICKER_START}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
        {hex ? (
          <Stack gap={1} className="min-w-0">
            <Text as="p" className="font-serif text-lg leading-snug break-words">
              {anchorFor(hex)?.canonical.name ?? "—"}
            </Text>
            <Text variant="mono" tone="secondary" as="p">
              {hex.toUpperCase()}
            </Text>
          </Stack>
        ) : (
          <Text variant="small" italic tone="secondary" as="p">
            {t("pick")}
          </Text>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <label className="relative inline-flex min-h-11 cursor-pointer items-center font-serif text-sm italic text-text-secondary transition-colors hover:text-text-primary">
          <span>{t("fromPhoto")}</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => void fromPhoto(e.target.files?.[0])}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
        {offered?.length === 0 && (
          <Text variant="small" italic tone="secondary">
            {t("photoNone")}
          </Text>
        )}
        {offered?.map((h) => (
          <button
            key={h}
            type="button"
            aria-label={t("usePhotoColour", { name: anchorFor(h)?.canonical.name ?? h.toUpperCase() })}
            aria-pressed={h === hex}
            onClick={() => onChange(h)}
            className="group inline-flex h-11 w-11 items-center justify-center outline-none focus-visible:ring-1 focus-visible:ring-focus-ring"
          >
            <span
              className={`block h-7 w-7 border transition-colors ${
                h === hex ? "border-text-primary border-2" : "border-border group-hover:border-text-primary"
              }`}
              style={{ backgroundColor: h }}
            />
          </button>
        ))}
      </div>
    </Stack>
  );
}

function Thinking() {
  const t = useTranslations("compra");
  return (
    <Text variant="small" italic tone="secondary" as="p" aria-live="polite">
      {t("thinking")}
    </Text>
  );
}

export function ShoppingAdvisor({ garments }: { garments: GarmentWithColors[] }) {
  const t = useTranslations("compra");
  const [category, setCategory] = useState<ShoppingCategory>("PANTS");
  const [mode, setMode] = useState<Mode>("suggest");
  const [hex, setHex] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE);
  const [reach, setReach] = useState<WardrobeReach | null>(null);
  const [recs, setRecs] = useState<Partial<Record<ShoppingCategory, Assessment[]>>>({});
  const results = useRef<HTMLDivElement>(null);

  // The wardrobe's reach runs the engine once per piece: kept off the
  // first paint, so the page and its controls show before the numbers.
  useEffect(() => {
    const id = setTimeout(() => setReach(wardrobeReach(garments)), 0);
    return () => clearTimeout(id);
  }, [garments]);

  // Recommendations are worked out a few colours per tick and kept per
  // category, so going back to one is instant.
  const cached = recs[category] !== undefined;
  useEffect(() => {
    if (!reach || mode !== "suggest" || cached) return;
    let cancelled = false;
    const hexes = candidateColours(category);
    const done: Assessment[] = [];
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      if (cancelled) return;
      for (const h of hexes.slice(i, i + BATCH)) done.push(assessColour(category, h, reach));
      i += BATCH;
      if (i < hexes.length) timer = setTimeout(step, 0);
      else setRecs((prev) => ({ ...prev, [category]: rankRecommendations(done) }));
    };
    timer = setTimeout(step, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [category, reach, mode, cached]);

  const assessment = useMemo(
    () => (reach && hex ? assessColour(category, hex, reach) : null),
    [reach, hex, category],
  );

  const owned = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of garments) {
      if (g.category !== category) continue;
      for (const c of g.colors) counts.set(c.hex, (counts.get(c.hex) ?? 0) + 1);
    }
    return { pieces: garments.filter((g) => g.category === category).length, colours: [...counts].map(([h, count]) => ({ hex: h, count })) };
  }, [garments, category]);

  const list = recs[category];

  return (
    <Stack gap={8}>
      <Section title={t("what")}>
        <SegmentedControl
          ariaLabel={t("what")}
          grid
          columns={2}
          value={category}
          onChange={(c) => {
            setCategory(c);
            setShown(PAGE);
          }}
          options={SHOPPING_CATEGORIES.map((c) => ({ value: c, label: t(`category.${c}`) }))}
        />
        {owned.colours.length > 0 && (
          <Stack gap={2}>
            <Text variant="caption" tone="secondary" tabular as="p">
              {t("owned", { count: owned.pieces })}
            </Text>
            <ColourStrip colours={owned.colours} className="h-6" />
          </Stack>
        )}
        <SegmentedControl
          ariaLabel={t("modeLabel")}
          value={mode}
          onChange={setMode}
          options={[
            { value: "suggest", label: t("mode.suggest") },
            { value: "check", label: t("mode.check") },
          ]}
        />
      </Section>

      <div ref={results} className="scroll-mt-28">
        {mode === "suggest" ? (
          <Section title={t("suggest.title")}>
            {!list ? (
              <Thinking />
            ) : list.length === 0 ? (
              <Text variant="small" italic tone="secondary" as="p">
                {t("suggest.empty")}
              </Text>
            ) : (
              <>
                <ol className="grid gap-x-10 gap-y-10 md:grid-cols-2">
                  {list.slice(0, shown).map((a, i) => (
                    <Recommendation
                      key={a.hex}
                      a={a}
                      n={i + 1}
                      onLook={() => {
                        setHex(a.hex);
                        setMode("check");
                        // The verdict replaces the list under the controls: take
                        // the reader to it rather than leave them mid-page.
                        requestAnimationFrame(() =>
                          results.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
                        );
                      }}
                    />
                  ))}
                </ol>
                {shown < list.length && (
                  <Button type="button" variant="secondary" onClick={() => setShown((x) => x + PAGE)} className="min-w-48 self-center">
                    {t("suggest.more")}
                  </Button>
                )}
              </>
            )}
          </Section>
        ) : (
          <Section title={t("check.title")}>
            <ColourInput hex={hex} onChange={setHex} />
            {hex && (assessment ? <Verdict a={assessment} /> : <Thinking />)}
          </Section>
        )}
      </div>
    </Stack>
  );
}
