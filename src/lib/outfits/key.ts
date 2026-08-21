/**
 * The identity of a saved outfit as the combiner sees it: its pieces and
 * the palette it was saved with. Sorted, so the order the builder
 * happened to pick the pieces in never produces two keys for one outfit.
 *
 * Pure, and in its own module for the same reason as `week.ts`: the
 * combiner is a client component, and importing this from `service.ts`
 * would drag `repository.ts` — and Prisma — into the browser bundle.
 */
export function outfitKey(garmentIds: string[], paletteId: number): string {
  return `${[...garmentIds].sort().join(",")}|${paletteId}`;
}
