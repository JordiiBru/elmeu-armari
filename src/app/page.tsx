import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { palettes } from "@/lib/colors";
import { Stack, Text, Heading } from "@/components/ui";

export const dynamic = "force-dynamic";

/**
 * The whole app, one entry per room. The week and the saved outfits live
 * under "què em poso?" and combining lives on a piece, so listing those
 * here would be listing the same rooms twice.
 *
 * The split that matters is not how often you open something, it is
 * whether it is *the app* or *about the app*. Paletes is the app, so it
 * belongs in this column; estadístiques and configuració are about it,
 * and live in the header menu instead. That is also what makes this page
 * hold together: four items on one axis, and nothing else to centre.
 */
const PRIMARY = ["avui", "armari", "bugaderia", "paleta"] as const;

function pickPalette() {
  const i = Math.floor(Math.random() * palettes.length);
  return palettes[i];
}

export default async function HomePage() {
  const t = await getTranslations("home");
  const palette = pickPalette();

  return (
    // One centred block, one quiet footer. The masthead used to sit at the
    // top with the index centred in what was left, which put the title high
    // and opened a hole between the palette rule and the links. Title,
    // rule and index are one composition, so they are centred as one.
    <div className="flex-1 flex flex-col justify-center px-6 pb-8 md:pb-10">
      <Stack as="section" gap={6} align="center" className="text-center">
        <Stack gap={3} align="center">
          <Heading level="display-xl">{t("title")}</Heading>
          <Text variant="subtitle" tone="secondary" italic as="p">
            {t("subtitle")}
          </Text>
        </Stack>

        {/* The masthead's rule, in colour. Close enough to the index to
            read as the line between a title and its contents. */}
        <Link
          href="/paleta"
          aria-label={t("paletteLink", { name: palette.nombre })}
          className="group block w-32 md:w-40 outline-none focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          <div className="flex h-3 md:h-4 overflow-hidden transition-transform duration-[var(--duration-slow)] ease-[var(--ease-spring)] group-hover:-translate-y-0.5">
            {palette.colores.map((hex, i) => (
              <div key={i} className="flex-1" style={{ backgroundColor: hex }} />
            ))}
          </div>
        </Link>

        <nav className="flex flex-col items-center gap-4 pt-1">
          {PRIMARY.map((entry) => (
            <Link
              key={entry}
              href={`/${entry}`}
              className="group relative font-serif text-xl text-text-primary transition-transform duration-[var(--duration-fast)] active:scale-[0.96]"
            >
              <span className="transition-opacity duration-[var(--duration-fast)] group-active:opacity-70">
                {t(`nav.${entry}`)}
              </span>
              <span
                aria-hidden
                className="pointer-events-none absolute left-0 right-0 -bottom-1 h-px bg-text-primary origin-center scale-x-0 group-hover:scale-x-100 transition-transform duration-[var(--duration-slow)] ease-out will-change-transform"
              />
            </Link>
          ))}
        </nav>
      </Stack>

    </div>
  );
}
