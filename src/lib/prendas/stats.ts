import { colourName } from "@/lib/colors/names";

/**
 * The Sanzo name shared by the most garments, for the sentence at the top of
 * `/stats`. It counts by the name on screen (`colourName`) rather than by
 * hex: two blacks a shade apart are one colour to whoever reads the page.
 * A garment votes once per name even if two of its colours read the same,
 * and a colour outside the vocabulary has no name and no vote. A tie goes
 * to the name met first.
 */
export function dominantColour(
  garments: { colors: { hex: string }[] }[],
): { name: string; count: number } | null {
  const counts = new Map<string, number>();
  for (const garment of garments) {
    const names = new Set<string>();
    for (const { hex } of garment.colors) {
      const name = colourName(hex);
      if (name) names.add(name);
    }
    for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  let best: { name: string; count: number } | null = null;
  for (const [name, count] of counts) {
    if (!best || count > best.count) best = { name, count };
  }
  return best;
}

/**
 * The category with the most garments. `null` unless it leads with at least
 * two: "1 of 4" is not something the wardrobe leans towards. A tie goes to
 * the earlier one in `order`.
 */
export function leadingCategory<C extends string>(
  counts: Record<C, number>,
  order: readonly C[],
): { category: C; count: number } | null {
  let best: { category: C; count: number } | null = null;
  for (const category of order) {
    const count = counts[category] ?? 0;
    if (!best || count > best.count) best = { category, count };
  }
  return best && best.count >= 2 ? best : null;
}
