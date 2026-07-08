import Link from "next/link";
import { Stack, Text, Heading } from "@/components/ui";

const PRIMARY = [
  { href: "/armari", label: "El meu armari" },
  { href: "/paleta", label: "Paletes" },
];

const SECONDARY = [
  { href: "/stats", label: "estadístiques" },
  { href: "/settings", label: "configuració" },
];

export default function HomePage() {
  return (
    <div className="flex-1 grid grid-rows-[1fr_auto_1fr] px-6 py-12 md:py-20">
      <Stack as="section" gap={5} align="center" className="self-end text-center">
        <Heading level="display-xl" className="md:type-display-xl">
          el meu armari
        </Heading>
        <Text variant="subtitle" tone="secondary" italic as="p">
          un estudi d&apos;harmonia visual
        </Text>
      </Stack>

      <div className="flex justify-center py-16 md:py-24">
        <div className="h-px w-16 bg-border" aria-hidden />
      </div>

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
