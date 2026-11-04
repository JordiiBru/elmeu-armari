"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { colourMatchesFor, palettesForAnchors } from "@/lib/colors/matches";
import type {
  AnchorPalettes,
  ColourMatch,
  PaletteView,
} from "@/lib/colors/matches";
import { cutParts, optionLabel } from "@/lib/prendas/labels";
import { PieceThumb } from "./PieceThumb";
import { Sheet, Text, TextButton, Stack } from "@/components/ui";

interface Props {
  garment: GarmentWithColors;
  onClose: () => void;
}

/**
 * A piece and its colours, nothing else. The wardrobe is for looking at
 * what you own; building outfits lives elsewhere. Each colour sits beside
 * the Sanzo Wada colour the engine reads it as, and the body scrolls on
 * into every palette that colour belongs to, smallest first: that anchor,
 * not the raw hex, is what any outfit is built from.
 */
export function GarmentModal({ garment, onClose }: Props) {
  const t = useTranslations("modal");
  const tLabel = useTranslations("labels");
  const tCommon = useTranslations("common");
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  const matches = useMemo(
    () => colourMatchesFor(garment.colors.map((c) => c.hex)),
    [garment.colors],
  );
  const anchorPalettes = useMemo(() => palettesForAnchors(matches), [matches]);

  const handleDelete = () => {
    if (pending) return;
    startTransition(async () => {
      await fetch(`/api/garments/${garment.id}`, { method: "DELETE" });
      /**
       * A full navigation, not `router.back()` or a client-side push.
       * Deleting happens from `/armari/[slug]` (or its intercepted
       * twin), and the moment the piece is gone that route 404s. A
       * Server Action here would auto-refresh that same doomed segment
       * on resolving, racing whatever navigates away next — reliably
       * lost in a production build, landing back on the dead URL or,
       * from the intercepted route, on the root not-found boundary.
       * A plain route handler carries no such refresh, and a hard
       * navigation sidesteps the parallel/intercepted route tree
       * entirely rather than asking the client router to reconcile it.
       */
      // Deliberate, and the reason is the comment above: the lint rule that
      // prefers the router is right in general, not for a route that just 404ed.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/armari");
    });
  };

  return (
    <Sheet
      onClose={onClose}
      size="2xl"
      fill
      split
      label={t("sheetLabel", {
        category: tLabel(`category.${garment.category}`),
      })}
      media={
        <PieceThumb
          garment={garment}
          priority
          sizes="(min-width: 640px) 45vw, 100vw"
          className="h-full w-full"
        />
      }
      mediaHeight="h-40"
      header={
        <Stack gap={1}>
          <Text variant="caption">{t("eyebrow")}</Text>
          <h2 className="type-title">
            {tLabel(`category.${garment.category}`)}
            {garment.subtype && (
              <Text as="span" italic tone="secondary" className="font-serif">
                {" "}
                · {optionLabel(tLabel, "subtype", garment.subtype)}
              </Text>
            )}
            {garment.length && (
              <Text as="span" italic tone="secondary" className="font-serif">
                {" "}
                · {optionLabel(tLabel, "length", garment.length)}
              </Text>
            )}
          </h2>
          {(garment.fit || garment.cropped || garment.size) && (
            <Text
              variant="small"
              italic
              tone="secondary"
              className="font-serif"
            >
              {[
                ...cutParts(tLabel, garment),
                garment.size ? t("size", { size: garment.size }) : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          )}
          {/* The piece's own actions sit under its name rather than in a
              pinned footer: a footer bar took a strip off every phone
              screen and hid where the body continues. */}
          {confirming ? (
            <div className="flex items-center gap-5 pt-1">
              <TextButton
                type="button"
                tone="danger"
                onClick={handleDelete}
                disabled={pending}
                className="type-small"
              >
                {pending ? tCommon("deleting") : tCommon("deleteConfirm")}
              </TextButton>
              <TextButton
                type="button"
                tone="secondary"
                onClick={() => setConfirming(false)}
                disabled={pending}
                className="type-small"
              >
                {tCommon("cancel")}
              </TextButton>
            </div>
          ) : (
            <div className="flex items-center gap-5 pt-1">
              <Link
                href={`/edit/${garment.id}`}
                className="inline-flex min-h-9 items-center font-serif italic type-small text-text-primary hover:text-text-secondary transition-colors"
              >
                {tCommon("edit")}
              </Link>
              <TextButton
                type="button"
                tone="danger"
                onClick={() => setConfirming(true)}
                className="type-small"
              >
                {tCommon("delete")}
              </TextButton>
            </div>
          )}
        </Stack>
      }
    >
      {(garment.texture || garment.pattern || garment.seasons.length > 0) && (
        <dl className="grid grid-cols-2 gap-y-4 gap-x-6">
          {garment.texture && (
            <Meta
              label={t("texture")}
              value={tLabel(`texture.${garment.texture}`)}
            />
          )}
          {garment.pattern && (
            <Meta
              label={t("pattern")}
              value={tLabel(`pattern.${garment.pattern}`)}
            />
          )}
          {garment.seasons.length > 0 && (
            <Meta
              wide
              label={t("seasons")}
              value={garment.seasons
                .map((s) => tLabel(`season.${s.season}`))
                .join(" · ")}
            />
          )}
        </dl>
      )}

      {garment.notes && (
        <Stack gap={1}>
          <Text variant="caption">{t("note")}</Text>
          <Text as="p" italic className="font-serif">
            {garment.notes}
          </Text>
        </Stack>
      )}

      {matches.length > 0 && <ColourTable matches={matches} />}

      {anchorPalettes.map((group) => (
        <AnchorSection key={group.anchor.hex} group={group} />
      ))}
    </Sheet>
  );
}

function Meta({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1 ${wide ? "col-span-2" : ""}`}>
      <dt>
        <Text variant="caption" as="span">
          {label}
        </Text>
      </dt>
      <dd className="font-serif">{value}</dd>
    </div>
  );
}

function Swatch({
  hex,
  className = "h-7 w-7",
}: {
  hex: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 border border-border ${className}`}
      style={{ backgroundColor: hex }}
    />
  );
}

/** The piece's own colour on the left, what it reads as on the right. */
function ColourTable({ matches }: { matches: ColourMatch[] }) {
  const t = useTranslations("modal");
  return (
    <section className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-x-6">
        <Text variant="caption">{t("colorExact")}</Text>
        <Text variant="caption">{t("colorNearest")}</Text>
      </div>
      <ul className="flex flex-col divide-y divide-border border-y border-border">
        {matches.map((m, i) => (
          <li key={`${m.hex}-${i}`} className="grid grid-cols-2 gap-x-6 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <Swatch hex={m.hex} />
              <Text variant="mono" tone="secondary" as="span">
                {m.hex.toUpperCase()}
              </Text>
            </div>
            {m.anchor ? (
              <div className="flex items-center gap-3 min-w-0">
                <Swatch hex={m.anchor.hex} />
                <span className="flex flex-col min-w-0">
                  <span className="font-serif leading-tight truncate">
                    {m.anchor.name}
                  </span>
                  <Text variant="mono" tone="secondary" as="span">
                    {m.anchor.hex.toUpperCase()}
                  </Text>
                </span>
              </div>
            ) : (
              <Text italic tone="secondary" className="font-serif self-center">
                {t("outsideVocabulary")}
              </Text>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Every palette with one anchor colour, grouped by how many colours it has. */
function AnchorSection({ group }: { group: AnchorPalettes }) {
  const t = useTranslations("modal");
  const bySize = new Map<number, PaletteView[]>();
  for (const p of group.palettes) {
    const list = bySize.get(p.colors.length) ?? [];
    list.push(p);
    bySize.set(p.colors.length, list);
  }
  return (
    <section className="flex flex-col gap-6 pt-2">
      <header className="flex items-end justify-between gap-4 border-b border-text-primary pb-2">
        <h3 className="type-title flex items-center gap-3 min-w-0">
          <Swatch hex={group.anchor.hex} className="h-5 w-5" />
          <span className="truncate">{group.anchor.name}</span>
        </h3>
        <Text variant="caption" tabular className="shrink-0">
          {t("paletteCount", { count: group.palettes.length })}
        </Text>
      </header>
      {group.palettes.length === 0 ? (
        <Text italic tone="secondary" className="font-serif">
          {t("noPalettes")}
        </Text>
      ) : (
        [...bySize.entries()].map(([size, list]) => (
          <div key={size} className="flex flex-col gap-3">
            <Text variant="caption">{t("paletteSize", { count: size })}</Text>
            <ul className="grid grid-cols-1 xl:grid-cols-2 gap-x-6 gap-y-4">
              {list.map((p) => (
                <PaletteRow key={p.id} palette={p} />
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}

/** A palette as a flat strip, numbered as on /paleta. */
function PaletteRow({ palette }: { palette: PaletteView }) {
  return (
    <li className="grid grid-cols-[2.75rem_1fr] items-center gap-x-2">
      <Text variant="caption" tabular>
        n{String(palette.id).padStart(3, "0")}
      </Text>
      <div className="flex h-9">
        {palette.colors.map((c, i) => (
          <span
            key={i}
            className="flex-1"
            style={{ backgroundColor: c.hex }}
            title={
              c.name
                ? `${c.name} · ${c.hex.toUpperCase()}`
                : c.hex.toUpperCase()
            }
          />
        ))}
      </div>
    </li>
  );
}
