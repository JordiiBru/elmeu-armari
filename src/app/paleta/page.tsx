import { palettes, namedColors, paletteColors } from "@/lib/colors";
import PaletaTabs from "@/components/PaletaTabs";

export default function PaletaPage() {
  // Preprocessem al servidor per evitar treball al client
  const enriched = palettes.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    colors: paletteColors(p),
  }));

  const colors = namedColors.map((c) => ({
    index: c.index,
    name: c.name,
    hex: c.hex,
    combinations: c.combinations.length,
  }));

  return (
    <div className="max-w-5xl mx-auto w-full px-6 md:px-10 pb-24">
      <header className="pt-2 pb-8 flex flex-col gap-2">
        <span className="text-[11px] tracking-[0.25em] uppercase text-foreground-secondary">
          catàleg cromàtic
        </span>
        <h1 className="font-serif text-5xl md:text-6xl tracking-tight leading-[0.95]">
          sanzo wada
        </h1>
        <p className="font-serif italic text-base text-foreground-secondary max-w-md">
          {colors.length} colors i {enriched.length} combinacions dels
          diccionaris cromàtics de sanzo wada, publicats a tòquio entre 1933
          i 1934.
        </p>
      </header>

      <PaletaTabs
        colorCount={colors.length}
        paletteCount={enriched.length}
        colors={colors}
        palettes={enriched}
      />
    </div>
  );
}
