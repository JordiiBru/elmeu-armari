import { palettes, namedColors, paletteColors } from "@/lib/colors";
import PaletaBrowser from "@/components/PaletaBrowser";

export default function PaletaPage() {
  const colors = namedColors.map((c) => ({
    index: c.index,
    name: c.name,
    hex: c.hex,
    combinations: c.combinations,
  }));

  const palettesById: Record<
    number,
    { id: number; colors: { hex: string; name: string | null }[] }
  > = {};
  for (const p of palettes) {
    palettesById[p.id] = { id: p.id, colors: paletteColors(p) };
  }

  return (
    <div className="max-w-5xl mx-auto w-full px-6 md:px-10 pb-24">
      <header className="pt-2 pb-8 flex flex-col gap-2">
        <span className="text-[11px] tracking-[0.25em] uppercase text-foreground-secondary">
          catàleg cromàtic
        </span>
        <h1 className="font-serif text-5xl md:text-6xl tracking-tight leading-[0.95]">
          sanzo wada
        </h1>
        <p className="font-serif italic text-base text-foreground-secondary max-w-lg leading-relaxed">
          {colors.length} colors de{" "}
          <span className="not-italic tracking-wide text-foreground">
            配色事典
          </span>{" "}
          — «a dictionary of color combinations», sis volums publicats a tòquio
          entre 1933 i 1934. tria un color per veure amb què combinava.
        </p>
      </header>

      <PaletaBrowser colors={colors} palettesById={palettesById} />
    </div>
  );
}
