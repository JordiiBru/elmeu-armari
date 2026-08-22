import { getTranslations } from "next-intl/server";
import { palettes, namedColors, paletteColors } from "@/lib/colors";
import PaletaBrowser from "@/components/PaletaBrowser";
import { PageContainer, SectionHeader } from "@/components/ui";

export default async function PaletaPage() {
  const t = await getTranslations("paleta");
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
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t.rich("subtitle", {
          count: colors.length,
          // The title of the book, in its own script: it is a name, not a
          // string to translate, and it must not inherit the italic.
          jp: (chunks) => (
            <span className="not-italic tracking-wide text-text-primary">
              {chunks}
            </span>
          ),
        })}
      />

      <PaletaBrowser colors={colors} palettesById={palettesById} />
    </PageContainer>
  );
}
