import Link from "next/link";
import { findAllGarments } from "@/lib/prendas/service";
import { findAllOutfits } from "@/lib/outfits/service";
import { PieceThumb } from "@/components/PieceThumb";
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

export default async function HomePage() {
  const [garments, outfits] = await Promise.all([
    findAllGarments(),
    findAllOutfits(),
  ]);

  const recent = garments.slice(0, 5);
  const empty = garments.length === 0;

  return (
    <div className="flex-1 grid grid-rows-[1fr_auto_1fr] px-6 py-12 md:py-20">
      <Stack as="section" gap={5} align="center" className="self-end text-center">
        <Heading level="display-xl">
          el meu armari
        </Heading>
        <Text variant="subtitle" tone="secondary" italic as="p">
          un estudi d&apos;harmonia visual
        </Text>
      </Stack>

      <Stack gap={5} align="center" className="py-16 md:py-24">
        <div className="h-px w-16 bg-border" aria-hidden />
        {!empty && (
          <>
            <Text variant="caption" tabular>
              {garments.length} peces · {outfits.length}{" "}
              {outfits.length === 1 ? "outfit desat" : "outfits desats"}
            </Text>
            {recent.length > 0 && (
              <div
                className="flex items-end gap-3"
                aria-label="Peces recents"
              >
                {recent.map((g) => (
                  <PieceThumb
                    key={g.id}
                    garment={g}
                    thumb
                    className="h-14 w-11 md:h-16 md:w-12"
                  />
                ))}
              </div>
            )}
          </>
        )}
      </Stack>

      <Stack as="section" gap={7} align="center" className="self-start">
        <nav className="flex flex-col items-center gap-4">
          {PRIMARY.map((entry) => (
            <Link
              key={entry.href}
              href={entry.href}
              className="group relative font-serif text-xl text-text-primary transition-transform duration-200 active:scale-[0.96]"
            >
              <span className="transition-opacity duration-200 group-active:opacity-70">
                {entry.label}
              </span>
              <span
                aria-hidden
                className="pointer-events-none absolute left-0 right-0 -bottom-1 h-px bg-text-primary origin-center scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out will-change-transform"
              />
            </Link>
          ))}
        </nav>

        {empty && (
          <Text variant="small" italic tone="secondary" as="p" className="font-serif max-w-xs text-center">
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
                className="hover:text-text-primary transition-colors duration-300"
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
