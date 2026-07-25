// Pure date math for the weekly planner — no Prisma, safe to import from
// server or client code. Weeks are Monday-first; days are UTC-normalized
// midnight so they compare/serialize predictably regardless of the
// server's local timezone.

export function dayKey(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
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
