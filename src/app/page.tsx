import Link from "next/link";
import { palettes } from "@/lib/colors";
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

export default function HomePage() {
  const palette = pickPalette();

  return (
    <div className="flex-1 grid grid-rows-[1fr_auto_1fr] px-6 py-12 md:py-20">
      <Stack as="section" gap={5} align="center" className="self-end text-center">
        <Heading level="display-xl">el meu armari</Heading>
        <Text variant="subtitle" tone="secondary" italic as="p">
          un estudi d&apos;harmonia visual
        </Text>
      </Stack>

      <div className="flex justify-center py-16 md:py-24">
        <Link
          href="/paleta"
          aria-label={`Paleta ${palette.nombre}`}
          className="group block w-40 md:w-56 outline-none focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          <div className="flex h-4 md:h-6 overflow-hidden transition-transform duration-[var(--duration-slow)] ease-[var(--ease-spring)] group-hover:-translate-y-0.5">
            {palette.colores.map((hex, i) => (
              <div
                key={i}
                className="flex-1"
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        </Link>
      </div>

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
