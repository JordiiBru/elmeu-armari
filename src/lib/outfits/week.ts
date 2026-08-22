// Pure date math for the weekly planner — no Prisma, safe to import from
// server or client code. Weeks are Monday-first; days are UTC-normalized
// midnight so they compare/serialize predictably regardless of the
// server's local timezone.

/**
 * The wardrobe lives in Barcelona, so its day starts at midnight there.
 * The container runs on UTC, and `dayKey(new Date())` therefore kept
 * yesterday until 02:00 local in summer (01:00 in winter) — the calendar
 * moved its "today" ring in the middle of the night. Every "what day is
 * it" question resolves through this zone instead of the process's.
 */
export const APP_TIME_ZONE = "Europe/Madrid";

const CIVIL_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function dayKey(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * The current day in `APP_TIME_ZONE`, as the same UTC-midnight key every
 * stored day uses. Never `dayKey(new Date())`: that reads the instant's
 * UTC date, which is a different day for the first hour or two of every
 * Barcelona morning.
 */
export function today(now: Date = new Date()): Date {
  const parts = CIVIL_DAY.formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)!.value);
  return new Date(Date.UTC(get("year"), get("month") - 1, get("day")));
}

export function addDays(date: Date, n: number): Date {
  const d = dayKey(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

export function startOfWeek(date: Date): Date {
  const d = dayKey(date);
  const mondayOffset = (d.getUTCDay() + 6) % 7; // 0 = Monday
  return addDays(d, -mondayOffset);
}

export function dayToISO(date: Date): string {
  return dayKey(date).toISOString().slice(0, 10); // YYYY-MM-DD
}

export function isoToDay(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function isSameDay(a: Date, b: Date): boolean {
  return dayKey(a).getTime() === dayKey(b).getTime();
}

/** Whole days between two calendar days, ignoring clock time entirely. */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((dayKey(to).getTime() - dayKey(from).getTime()) / 86_400_000);
}
