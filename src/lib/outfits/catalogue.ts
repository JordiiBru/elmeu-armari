import type { SavedOutfit } from "./types";

/**
 * The number under every outfit (n001, n002…): the order it was saved
 * in, oldest first, starting at 1. Fixed for good once given — ranking
 * for today, favouriting or filtering never renumber anything. It used
 * to be the position in today's ranking, which puts never-worn outfits
 * first, so every outfit just saved was n001 and pushed the rest down.
 */
export function catalogueNumbers(outfits: Pick<SavedOutfit, "id" | "createdAt">[]): Record<string, number> {
  const ordered = [...outfits].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id),
  );
  return Object.fromEntries(ordered.map((o, i) => [o.id, i + 1]));
}
