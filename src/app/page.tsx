import Link from "next/link";
import { findAllGarments } from "@/lib/prendas/service";
import { findAllOutfits } from "@/lib/outfits/service";
import { palettes, paletteColors } from "@/lib/colors";
import { Stack, Text, Heading } from "@/components/ui";

export const dynamic = "force-dynamic";

const PRIMARY = [
  { href: "/armari", label: "El meu armari" },
  { href: "/paleta", label: "Paletes" },
];

const SECONDARY = [
  { href: "/stats", label: "estadístiques" },
  { href: "/settings", label: "configuració" },
];

function pickPalette() {
  const i = Math.floor(Math.random() * palettes.length);
  return palettes[i];
}

export default async function HomePage() {
  const [garments, outfits] = await Promise.all([
    findAllGarments(),
    findAllOutfits(),
  ]);

  const empty = garments.length === 0;
  const palette = pickPalette();
  const colors = paletteColors(palette);

  return (
    <div className="flex-1 grid grid-rows-[1fr_auto_1fr] px-6 py-12 md:py-20">
      <Stack as="section" gap={5} align="center" className="self-end text-center">
        <Heading level="display-xl">el meu armari</Heading>
        <Text variant="subtitle" tone="secondary" italic as="p">
          un estudi d&apos;harmonia visual
        </Text>
      </Stack>

      <Stack gap={6} align="center" className="py-16 md:py-24 w-full">
        <div className="h-px w-16 bg-border" aria-hidden />

        {!empty && (
          <Text variant="caption" tabular>
            {garments.length} peces · {outfits.length}{" "}
            {outfits.length === 1 ? "outfit desat" : "outfits desats"}
          </Text>
        )}

        <Link
          href="/paleta"
          aria-label={`Explorar paleta ${palette.nombre}`}
          className="group w-full max-w-2xl flex flex-col gap-3"
        >
          <div className="flex h-20 md:h-28 w-full overflow-hidden transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)] group-hover:-translate-y-0.5">
            {palette.colores.map((hex, i) => (
              <div
                key={i}
                className="flex-1"
                style={{ backgroundColor: hex }}
                title={colors[i]?.name ?? hex}
              />
            ))}
          </div>
          <div className="flex items-baseline justify-between">
            <Text variant="caption">paleta d&apos;avui</Text>
            <Text as="span" italic tone="secondary" className="font-serif type-small">
              {palette.nombre}
            </Text>
            <Text variant="caption" tabular>
              n{String(palette.id).padStart(3, "0")}
            </Text>
          </div>
        </Link>
      </Stack>

      <Stack as="section" gap={7} align="center" className="self-start">
        <nav className="flex flex-col items-center gap-4">
          {PRIMARY.map((entry) => (
            <Link
              key={entry.href}
              href={entry.href}
              className="group relative font-serif text-xl text-text-primary transition-transform duration-[var(--duration-fast)] active:scale-[0.96]"
            >
              <span className="transition-opacity duration-[var(--duration-fast)] group-active:opacity-70">
                {entry.label}
              </span>
              <span
                aria-hidden
                className="pointer-events-none absolute left-0 right-0 -bottom-1 h-px bg-text-primary origin-center scale-x-0 group-hover:scale-x-100 transition-transform duration-[var(--duration-slow)] ease-out will-change-transform"
              />
            </Link>
          ))}
        </nav>

        {empty && (
          <Text
            variant="small"
            italic
            tone="secondary"
            as="p"
            className="font-serif max-w-xs text-center"
          >
            l&apos;armari encara és buit. comença afegint una peça.
          </Text>
        )}

        <nav className="flex items-center gap-6 font-serif italic type-small text-text-secondary">
          {SECONDARY.map((entry, i) => (
            <span key={entry.href} className="inline-flex items-center gap-6">
              {i > 0 && (
                <span
                  aria-hidden
                  className="inline-block h-1 w-1 rounded-full bg-border"
                />
              )}
              <Link
                href={entry.href}
                className="hover:text-text-primary transition-colors duration-[var(--duration-base)]"
              >
                {entry.label}
              </Link>
            </span>
          ))}
        </nav>
      </Stack>
    </div>
  );
}
