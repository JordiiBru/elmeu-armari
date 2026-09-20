/**
 * The wardrobe as a strip of flat colour, each block as wide as the number
 * of garments that carry it: the same gesture as the palette on `/ajuda`,
 * with the user's own clothes instead of a page of the dictionary.
 */
export function ColourStrip({
  colours,
  className = "",
}: {
  colours: { hex: string; count: number }[];
  className?: string;
}) {
  return (
    <div aria-hidden className={`flex w-full overflow-hidden border border-border ${className}`}>
      {colours.map((c) => (
        <div
          key={c.hex}
          className="basis-0"
          style={{ backgroundColor: c.hex, flexGrow: c.count }}
        />
      ))}
    </div>
  );
}
