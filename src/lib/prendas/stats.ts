/**
 * How many garments carry each colour, most common first. It counts the hex
 * as stored: two blacks a shade apart stay two entries, which is what makes
 * the strip on `/stats` read as the wardrobe and not as a dictionary.
 */
export function colourCounts(
  garments: { colors: { hex: string }[] }[],
): { hex: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const garment of garments) {
    for (const hex of new Set(garment.colors.map((c) => c.hex.toLowerCase()))) {
      counts.set(hex, (counts.get(hex) ?? 0) + 1);
    }
  }
  return [...counts]
    .map(([hex, count]) => ({ hex, count }))
    .sort((a, b) => b.count - a.count || a.hex.localeCompare(b.hex));
}
