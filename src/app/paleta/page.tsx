import { palettes, namedColors, paletteColors } from "@/lib/colors";
import PaletaBrowser from "@/components/PaletaBrowser";
import { PageContainer, SectionHeader } from "@/components/ui";

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
    <PageContainer width="wide">
      <SectionHeader
        eyebrow="catàleg cromàtic"
        title="sanzo wada"
        subtitle={
          <>
            {colors.length} colors de{" "}
            <span className="not-italic tracking-wide text-text-primary">
              配色事典
            </span>{" "}
            — «a dictionary of color combinations», sis volums publicats a tòquio
            entre 1933 i 1934. tria un color per veure amb què combinava.
          </>
        }
      />

      <PaletaBrowser colors={colors} palettesById={palettesById} />
    </PageContainer>
  );
}
