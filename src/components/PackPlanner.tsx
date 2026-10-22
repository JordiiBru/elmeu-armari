"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { palettes } from "@/lib/colors";
import {
  planTrip,
  LAUNDRY_EVERY_DAYS,
  MAX_TRIP_DAYS,
  MAX_WEARS_BETWEEN_WASHES,
} from "@/lib/outfits/pack";
import type { PackMode, TripDay, TripError, TripPlan, TripWeather } from "@/lib/outfits/pack";
import { addDays, daysBetween, dayToISO, isoToDay } from "@/lib/outfits/week";
import { PieceThumb } from "./PieceThumb";
import { pieceLabel } from "./OutfitTile";
import {
  Button,
  Checkbox,
  Field,
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Stack as="section" gap={4}>
      <div className="border-b border-border pb-3">
        <Text variant="caption" as="h2">
          {title}
        </Text>
      </div>
      {children}
    </Stack>
  );
}

/** Wrapping grid sized to the screen, never a horizontal scroller. */
const TILE_GRID = "grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3";

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

function DayRow({ day, n }: { day: TripDay; n: number }) {
  const t = useTranslations("maleta.result");
  const locale = useLocale();
  return (
    <Stack as="li" gap={3}>
      <Text as="h3" className="font-serif">
        {t("day", { n, date: dayLabel(day.date, locale) })}
      </Text>
      {day.outfit ? (
        <ul className={TILE_GRID}>
          {day.outfit.map((g) => (
            <PieceTile key={g.id} garment={g} />
          ))}
          {day.coat && <PieceTile garment={day.coat} />}
          {day.accessories.map((g) => (
            <PieceTile key={g.id} garment={g} />
          ))}
        </ul>
      ) : (
        <Text variant="small" italic className="font-serif text-danger">
          {t(`missing.${day.missing ?? "colour"}`)}
        </Text>
      )}
      {day.coatMissing && (
        <Text variant="small" italic tone="secondary" className="font-serif">
          {t("coatMissing")}
        </Text>
      )}
    </Stack>
  );
}

function PlanView({ plan }: { plan: TripPlan }) {
  const t = useTranslations("maleta.result");
  const locale = useLocale();
  const dayNumber = new Map(plan.days.map((d, i) => [d.date, i + 1]));
  const shoesPacked = plan.packed.filter((g) => g.category === "SHOES").length;

  return (
    <Stack gap={7}>
      <Section title={t("packed")}>
        <Text variant="small" tone="secondary">
          {t("packedCount", { count: plan.packed.length })}
        </Text>
        {plan.packed.length > 0 && (
          <ul className={TILE_GRID}>
            {plan.packed.map((g) => (
              <PieceTile key={g.id} garment={g} />
            ))}
          </ul>
        )}
        {plan.shoesRepeat && shoesPacked > 0 && (
          <Text variant="small" italic tone="secondary" className="font-serif">
            {t("shoesRepeat", { shoes: shoesPacked, days: plan.days.length })}
          </Text>
        )}
      </Section>

      <Section title={t("days")}>
        <Stack as="ol" gap={6}>
          {plan.days.map((day, i) => (
            <DayRow key={day.date} day={day} n={i + 1} />
          ))}
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
    </Stack>
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
  const [weather, setWeather] = useState<TripWeather>("mixed");
  const [mode, setMode] = useState<PackMode>("minimize");
  const [laundry, setLaundry] = useState(false);
  // Everything is offered by default: the person takes out what stays home.
  const [poolIds, setPoolIds] = useState(() => new Set(pool.map((g) => g.id)));
  const [shoeIds, setShoeIds] = useState(() => new Set(shoes.map((g) => g.id)));
  const [accessoryIds, setAccessoryIds] = useState(() => new Set(accessories.map((g) => g.id)));
  const [result, setResult] = useState<TripPlan | TripError | null>(null);
  const [pending, startTransition] = useTransition();

  const span = start && end ? daysBetween(isoToDay(start), isoToDay(end)) + 1 : 0;

  const submit = () => {
    if (!start || !end) {
      setResult("range");
      return;
    }
    startTransition(() => {
      setResult(
        planTrip({
          start: isoToDay(start),
          end: isoToDay(end),
          weather,
          mode,
          laundry,
          pool: pool.filter((g) => poolIds.has(g.id)),
          shoes: shoes.filter((g) => shoeIds.has(g.id)),
          accessories: accessories.filter((g) => accessoryIds.has(g.id)),
          palettes,
        }),
      );
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
          <Text variant="small" tone="secondary" tabular>
            {t("length", { days: span, nights: span - 1 })}
          </Text>
        )}

        <Stack gap={2}>
          <Text variant="caption" as="h3">
            {t("weather.label")}
          </Text>
          <SegmentedControl<TripWeather>
            value={weather}
            onChange={setWeather}
            ariaLabel={t("weather.label")}
            options={[
              { value: "hot", label: t("weather.hot") },
              { value: "cold", label: t("weather.cold") },
              { value: "mixed", label: t("weather.mixed") },
            ]}
            className="self-start"
          />
        </Stack>

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

        <Stack gap={1}>
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
        <Button type="button" size="lg" onClick={submit} loading={pending} loadingText={t("submitting")} className="self-start">
          {t("submit")}
        </Button>
        {(result === "range" || result === "tooLong") && (
          <Text variant="small" italic className="font-serif text-danger" role="alert">
            {t(`errors.${result}`, { max: MAX_TRIP_DAYS })}
          </Text>
        )}
      </Stack>

      {result !== null && typeof result !== "string" && <PlanView plan={result} />}
    </Stack>
  );
}
