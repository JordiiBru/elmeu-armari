"use client";

import { useCallback, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { palettes } from "@/lib/colors";
import {
  planTrip,
  LAUNDRY_EVERY_DAYS,
  MAX_TRIP_DAYS,
  MAX_WEARS_BETWEEN_WASHES,
} from "@/lib/outfits/pack";
import { weatherFor } from "@/lib/outfits/pack";
import type { PackMode, TripDay, TripError, TripPlan, TripWeather } from "@/lib/outfits/pack";
import { addDays, daysBetween, dayToISO, isoToDay } from "@/lib/outfits/week";
import { PieceThumb } from "./PieceThumb";
import { pieceLabel } from "./OutfitTile";
import {
  Button,
  Checkbox,
  Field,
  Heading,
  Icon,
  Input,
  SegmentedControl,
  Stack,
  Text,
  TextButton,
} from "@/components/ui";

/** What the pool checklist offers: the pieces the plan wears, plus coats. */
const POOL_CATEGORIES = new Set(["SHIRT", "SWEATER", "PANTS", "OUTERWEAR"]);

/** A first trip is a long weekend. */
const DEFAULT_TRIP_DAYS = 3;

function dayLabel(iso: string, locale: string): string {
  // A day key, read back in UTC: which day it names was settled already.
  return isoToDay(iso).toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** A form or result section: a serif title over a strong rule, so it
 * never reads like the small-caps labels of the options inside it. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
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

/** "2 – 4 November", in the active locale, from two day keys. */
function rangeLabel(startISO: string, endISO: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).formatRange(isoToDay(startISO), isoToDay(endISO));
}

/** Wrapping grid sized to the screen, never a horizontal scroller. */
const TILE_GRID = "grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3";

/** The suitcase grouped the way it is packed: outer layers first. */
const PACK_ORDER = ["OUTERWEAR", "SHIRT", "SWEATER", "PANTS", "SHOES", "ACCESSORI"] as const;

function ToggleTile({
  garment,
  selected,
  onToggle,
  label,
}: {
  garment: GarmentWithColors;
  selected: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      aria-label={label}
      className="relative text-left outline-none focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div
        className={`relative aspect-[3/4] w-full overflow-hidden border transition-[border-color,opacity] duration-[var(--duration-base)] ease-[var(--ease-standard)] ${
          selected ? "border-text-primary border-2" : "border-border opacity-40"
        }`}
      >
        <PieceThumb garment={garment} thumb loading="lazy" sizes="120px" className="h-full w-full" />
        {selected && (
          <span className="absolute top-1.5 right-1.5 inline-flex bg-text-primary p-1 text-text-inverse">
            <Icon name="check" size={12} />
          </span>
        )}
      </div>
    </button>
  );
}

function PiecePicker({
  title,
  garments,
  selected,
  onChange,
}: {
  title: string;
  garments: GarmentWithColors[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const t = useTranslations("maleta.pool");
  const tLabels = useTranslations("labels");
  const count = garments.filter((g) => selected.has(g.id)).length;

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  return (
    <Section title={title}>
      {garments.length === 0 ? (
        <Text variant="small" italic tone="secondary">
          {t("empty")}
        </Text>
      ) : (
        <>
          <div className="flex items-center gap-6">
            <Text variant="small" tone="secondary" tabular>
              {t("count", { selected: count, total: garments.length })}
            </Text>
            <TextButton type="button" tone="secondary" onClick={() => onChange(new Set(garments.map((g) => g.id)))}>
              {t("all")}
            </TextButton>
            <TextButton type="button" tone="secondary" onClick={() => onChange(new Set())}>
              {t("none")}
            </TextButton>
          </div>
          <div className={TILE_GRID}>
            {garments.map((g) => (
              <ToggleTile
                key={g.id}
                garment={g}
                selected={selected.has(g.id)}
                onToggle={() => toggle(g.id)}
                label={pieceLabel(tLabels, g)}
              />
            ))}
          </div>
        </>
      )}
    </Section>
  );
}

function PieceTile({ garment, note }: { garment: GarmentWithColors; note?: string }) {
  const tLabels = useTranslations("labels");
  return (
    <li className="flex min-w-0 flex-col gap-1.5">
      <PieceThumb garment={garment} thumb loading="lazy" sizes="120px" className="aspect-[3/4] w-full border border-border" />
      <Text variant="caption" tone="secondary" truncate className="block">
        {note ?? pieceLabel(tLabels, garment)}
      </Text>
    </li>
  );
}

function DayCell({
  day,
  n,
  laundryAfter,
}: {
  day: TripDay;
  n: number;
  laundryAfter: boolean;
}) {
  const t = useTranslations("maleta.result");
  const locale = useLocale();
  const pieces = day.outfit ? [...day.outfit, ...(day.coat ? [day.coat] : []), ...day.accessories] : [];
  return (
    // A vertical axis on the left, one dot per day. From sm up the day's
    // date and palette sit in a column of their own, beside the pieces.
    <li className="group relative grid grid-cols-[1rem_1fr] gap-x-4 pb-12 sm:gap-x-6">
      <span aria-hidden className="absolute top-2 bottom-0 left-2 w-px bg-border-strong group-last:hidden" />
      {/* Timeline dot: a documented exception to square corners. */}
      <span
        aria-hidden
        className={`relative mt-1 h-4 w-4 rounded-full border-2 border-text-primary ${
          day.outfit ? "bg-text-primary" : "bg-background"
        }`}
      />
      <div className="grid min-w-0 gap-4 sm:grid-cols-[12rem_1fr] sm:gap-8">
        <Stack gap={3}>
          <div>
            <Text variant="caption" tone="secondary" as="p">
              {t("day", { n })}
            </Text>
            <Text as="h3" className="font-serif text-lg first-letter:uppercase">
              {dayLabel(day.date, locale)}
            </Text>
          </div>
          {day.palette && (
            <Stack gap={1}>
              <div aria-hidden className="flex h-2 w-full max-w-48 overflow-hidden">
                {day.palette.colores.map((hex, i) => (
                  <span key={i} className="flex-1" style={{ backgroundColor: hex }} />
                ))}
              </div>
              <Text variant="small" italic tone="secondary">
                {t("palette", { name: day.palette.nombre })}
              </Text>
            </Stack>
          )}
          {laundryAfter && (
            <Text variant="small" italic tone="secondary">
              {t("laundryHere")}
            </Text>
          )}
        </Stack>
        {day.outfit ? (
          <ul className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-7">
            {pieces.map((g) => (
              <PieceTile key={g.id} garment={g} />
            ))}
          </ul>
        ) : (
          <Text variant="small" italic className="text-danger">
            {t(`missing.${day.missing ?? "colour"}`)}
          </Text>
        )}
      </div>
    </li>
  );
}

function Summary({
  plan,
  weather,
  mode,
}: {
  plan: TripPlan;
  weather: TripWeather;
  mode: PackMode;
}) {
  const t = useTranslations("maleta");
  const locale = useLocale();
  const first = plan.days[0].date;
  const last = plan.days[plan.days.length - 1].date;
  const facts = [
    { label: t("result.facts.weather"), value: t(`weather.${weather}`) },
    { label: t("result.facts.mode"), value: t(`mode.${mode}`) },
    { label: t("result.facts.laundry"), value: t("result.laundryCount", { count: plan.laundry.length }) },
    { label: t("result.facts.packed"), value: t("result.packedCount", { count: plan.packed.length }) },
  ];
  return (
    <Stack as="header" gap={4} align="center" className="border-y border-border-strong py-12 text-center">
      <Text variant="caption" tone="secondary" as="p">
        {t("result.summaryEyebrow")}
      </Text>
      <Heading level="hero" as="h2" className="tabular-nums sm:text-[length:var(--font-size-display)]">
        {t("length", { days: plan.days.length, nights: plan.nights })}
      </Heading>
      <Text variant="subtitle" italic tone="secondary" as="p">
        {rangeLabel(first, last, locale)}
      </Text>
      <dl className="mt-4 grid grid-cols-2 gap-x-10 gap-y-5 sm:grid-cols-4">
        {facts.map((f) => (
          <div key={f.label} className="flex flex-col gap-1">
            <Text variant="caption" tone="secondary" as="dt">
              {f.label}
            </Text>
            <Text as="dd" className="font-serif text-lg">
              {f.value}
            </Text>
          </div>
        ))}
      </dl>
    </Stack>
  );
}

function PlanView({
  plan,
  weather,
  mode,
}: {
  plan: TripPlan;
  weather: TripWeather;
  mode: PackMode;
}) {
  const t = useTranslations("maleta.result");
  const tLabels = useTranslations("labels");
  const locale = useLocale();
  const dayNumber = new Map(plan.days.map((d, i) => [d.date, i + 1]));
  const washDays = new Set(plan.laundry.map((s) => s.after));
  // Scroll the plan into view when it appears: the form above it is long.
  const reveal = useCallback((el: HTMLElement | null) => {
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div ref={reveal} className="flex scroll-mt-6 flex-col gap-16">
      <Summary plan={plan} weather={weather} mode={mode} />

      <Section title={t("days")}>
        <ol>
          {plan.days.map((day, i) => (
            <DayCell key={day.date} day={day} n={i + 1} laundryAfter={washDays.has(day.date)} />
          ))}
        </ol>
      </Section>

      <Section title={t("packed")}>
        <Text variant="small" tone="secondary">
          {t("packedCount", { count: plan.packed.length })}
        </Text>
        <Stack gap={6}>
          {PACK_ORDER.map((category) => {
            const items = plan.packed.filter((g) => g.category === category);
            if (items.length === 0) return null;
            return (
              <Stack key={category} gap={3}>
                <Text variant="caption" tone="secondary" as="h3">
                  {tLabels(`category.${category}`)} · {items.length}
                </Text>
                <ul className={TILE_GRID}>
                  {items.map((g) => (
                    <PieceTile key={g.id} garment={g} />
                  ))}
                </ul>
              </Stack>
            );
          })}
        </Stack>
      </Section>

      {plan.laundry.length > 0 && (
        <Section title={t("laundry")}>
          <Stack as="ol" gap={6}>
            {plan.laundry.map((session) => (
              <Stack as="li" key={session.after} gap={3}>
                <Text as="h3" className="font-serif">
                  {t("laundryAfter", {
                    n: dayNumber.get(session.after) ?? 0,
                    date: dayLabel(session.after, locale),
                  })}
                </Text>
                <ul className={TILE_GRID}>
                  {session.garments.map((g) => (
                    <PieceTile key={g.id} garment={g} />
                  ))}
                </ul>
              </Stack>
            ))}
          </Stack>
        </Section>
      )}
    </div>
  );
}

/**
 * The trip form and its plan. The plan is computed here, in the browser,
 * the same way "què hi combina" runs the engine: everything it needs is
 * already on the page and nothing is saved.
 */
export function PackPlanner({
  garments,
  todayISO,
}: {
  garments: GarmentWithColors[];
  todayISO: string;
}) {
  const t = useTranslations("maleta");
  const pool = garments.filter((g) => POOL_CATEGORIES.has(g.category));
  const shoes = garments.filter((g) => g.category === "SHOES");
  const accessories = garments.filter((g) => g.category === "ACCESSORI");

  const [start, setStart] = useState(todayISO);
  const [end, setEnd] = useState(() => dayToISO(addDays(isoToDay(todayISO), DEFAULT_TRIP_DAYS - 1)));
  const [mode, setMode] = useState<PackMode>("minimize");
  const [laundry, setLaundry] = useState(false);
  // Everything is offered by default: the person takes out what stays home.
  const [poolIds, setPoolIds] = useState(() => new Set(pool.map((g) => g.id)));
  const [shoeIds, setShoeIds] = useState(() => new Set(shoes.map((g) => g.id)));
  const [accessoryIds, setAccessoryIds] = useState(() => new Set(accessories.map((g) => g.id)));
  // The plan keeps what it was asked with, so its summary does not change
  // when the form is touched afterwards. A new id remounts the view, which
  // scrolls it into sight again.
  const [result, setResult] = useState<
    | { id: number; plan: TripPlan; weather: TripWeather; mode: PackMode; laundry: boolean }
    | TripError
    | null
  >(null);
  const plan = result !== null && typeof result !== "string" ? result : null;
  // Every look proposed so far, so the next press tries others.
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
  // The settings the looks in `seen` were proposed under. Change any of them
  // and the list starts again: looks from another trip are not repeats.
  const [seenFor, setSeenFor] = useState("");
  const [pending, startTransition] = useTransition();

  const span = start && end ? daysBetween(isoToDay(start), isoToDay(end)) + 1 : 0;

  const submit = (overrides?: { laundry?: boolean }) => {
    if (!start || !end) {
      setResult("range");
      return;
    }
    const useLaundry = overrides?.laundry ?? laundry;
    // A trip that starts today is not washed yet: a dirty piece stays home.
    const chosen = pool.filter((g) => poolIds.has(g.id));
    const leaving = start === todayISO ? chosen.filter((g) => !g.dirtySince) : chosen;
    const weather = weatherFor(chosen);
    const key = [start, end, weather, mode, useLaundry, [...poolIds].sort(), [...shoeIds].sort(), [...accessoryIds].sort()].join("|");
    const base = key === seenFor ? seen : new Set<string>();
    startTransition(() => {
      const next = planTrip({
        start: isoToDay(start),
        end: isoToDay(end),
        weather,
        mode,
        laundry: useLaundry,
        pool: leaving,
        shoes: shoes.filter((g) => shoeIds.has(g.id)),
        accessories: accessories.filter((g) => accessoryIds.has(g.id)),
        palettes,
        // Pressing again proposes looks not shown yet, while there are any.
        seen: base,
      });
      if (typeof next === "string") {
        setResult(next);
        return;
      }
      setSeen(new Set([...base, ...next.days.flatMap((d) => (d.look ? [d.look] : []))]));
      setSeenFor(key);
      setResult({ id: (plan?.id ?? 0) + 1, plan: next, weather, mode, laundry: useLaundry });
    });
  };

  return (
    <Stack gap={7}>
      <Section title={t("trip")}>
        <div className="grid grid-cols-2 gap-6 max-w-md">
          <Field label={t("start")} htmlFor="trip-start">
            <Input id="trip-start" type="date" value={start} min={todayISO} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label={t("end")} htmlFor="trip-end">
            <Input id="trip-end" type="date" value={end} min={start || todayISO} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        </div>
        {span >= 1 && (
          <Text variant="subtitle" italic tone="secondary" tabular>
            {t("length", { days: span, nights: span - 1 })}
          </Text>
        )}
      </Section>

      <Section title={t("preferences")}>
        <Stack gap={2}>
          <Text variant="caption" as="h3">
            {t("mode.label")}
          </Text>
          <SegmentedControl<PackMode>
            value={mode}
            onChange={setMode}
            ariaLabel={t("mode.label")}
            options={[
              { value: "minimize", label: t("mode.minimize") },
              { value: "noRepeat", label: t("mode.noRepeat") },
            ]}
            className="self-start"
          />
        </Stack>

        <Stack gap={2}>
          <Checkbox label={t("laundry.label")} checked={laundry} onChange={(e) => setLaundry(e.target.checked)} />
          <Text variant="small" italic tone="secondary" className="font-serif pl-7">
            {t("laundry.hint", {
              every: LAUNDRY_EVERY_DAYS,
              tops: MAX_WEARS_BETWEEN_WASHES.SHIRT ?? 1,
              pants: MAX_WEARS_BETWEEN_WASHES.PANTS ?? 1,
            })}
          </Text>
        </Stack>
      </Section>

      <PiecePicker title={t("pool.clothes")} garments={pool} selected={poolIds} onChange={setPoolIds} />
      <PiecePicker title={t("pool.shoes")} garments={shoes} selected={shoeIds} onChange={setShoeIds} />
      <PiecePicker title={t("pool.accessories")} garments={accessories} selected={accessoryIds} onChange={setAccessoryIds} />

      <Stack gap={3}>
        <Button type="button" size="lg" onClick={() => submit()} loading={pending} loadingText={t("submitting")} className="self-start">
          {t("submit")}
        </Button>
        {(result === "range" || result === "tooLong") && (
          <Text variant="small" italic className="font-serif text-danger" role="alert">
            {t(`errors.${result}`, { max: MAX_TRIP_DAYS })}
          </Text>
        )}
      </Stack>

      {plan && (
        <Stack gap={5}>
          <div className="fixed right-6 bottom-6 z-20 flex flex-wrap items-center gap-4 border border-border-strong bg-background p-3">
            <Button type="button" variant="secondary" onClick={() => submit()} loading={pending} loadingText={t("submitting")}>
              {t("reroll")}
            </Button>
            {!plan.laundry && plan.plan.days.some((d) => d.missing === "top" || d.missing === "pants") && (
              <TextButton
                type="button"
                tone="secondary"
                onClick={() => {
                  setLaundry(true);
                  submit({ laundry: true });
                }}
              >
                {t("tryLaundry")}
              </TextButton>
            )}
          </div>
          <PlanView key={plan.id} plan={plan.plan} weather={plan.weather} mode={plan.mode} />
        </Stack>
      )}
    </Stack>
  );
}
