/**
 * Socks were a category until they were removed. An export made back then
 * still carries them, and one such row must not fail the whole import, so
 * they are set aside before validation and reported as skipped.
 */
const REMOVED_CATEGORIES = new Set(["SOCKS"]);

export function setAsideRemovedCategories(body: unknown): {
  body: unknown;
  skipped: number;
  /** Where each kept row sat in the file, so an error names the row the
   * person will find, not its place among the survivors. */
  originalIndexes: number[];
} {
  if (typeof body !== "object" || body === null) return { body, skipped: 0, originalIndexes: [] };
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.garments)) return { body, skipped: 0, originalIndexes: [] };
  const originalIndexes: number[] = [];
  const kept = b.garments.filter((g, i) => {
    const removed =
      typeof g === "object" &&
      g !== null &&
      REMOVED_CATEGORIES.has((g as Record<string, unknown>).category as string);
    if (!removed) originalIndexes.push(i);
    return !removed;
  });
  return {
    body: { ...b, garments: kept },
    skipped: b.garments.length - kept.length,
    originalIndexes,
  };
}

/**
 * `CROPPED` used to be a fit. An export made before it became a flag of its
 * own carries `fit: "CROPPED"`; read back as it is, it would fail the fit
 * check, so it is turned into what the migration turned the stored rows into:
 * cropped, with no fit.
 */
export function upgradeLegacyCropped(body: unknown): unknown {
  if (typeof body !== "object" || body === null) return body;
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.garments)) return body;
  return {
    ...b,
    garments: b.garments.map((g) => {
      if (typeof g !== "object" || g === null) return g;
      const row = g as Record<string, unknown>;
      return row.fit === "CROPPED" ? { ...row, fit: null, cropped: true } : row;
    }),
  };
}
