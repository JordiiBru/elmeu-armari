/**
 * Socks were a category until they were removed. An export made back then
 * still carries them, and one such row must not fail the whole import, so
 * they are set aside before validation and reported as skipped.
 */
const REMOVED_CATEGORIES = new Set(["SOCKS"]);

export function setAsideRemovedCategories(body: unknown): { body: unknown; skipped: number } {
  if (typeof body !== "object" || body === null) return { body, skipped: 0 };
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.garments)) return { body, skipped: 0 };
  const kept = b.garments.filter(
    (g) =>
      !(
        typeof g === "object" &&
        g !== null &&
        REMOVED_CATEGORIES.has((g as Record<string, unknown>).category as string)
      ),
  );
  return { body: { ...b, garments: kept }, skipped: b.garments.length - kept.length };
}
