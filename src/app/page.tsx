import Link from "next/link";
import { palettes } from "@/lib/colors";
import { Stack, Text, Heading } from "@/components/ui";

export const dynamic = "force-dynamic";

/**
 * Three doors, one per thing you actually do: decide a look, keep the
 * catalogue, know what is clean. Everything else is reachable from
 * inside one of them — the week and the saved outfits live under "què em
 * poso?", combining lives on a piece — so listing them here would be
 * listing the same rooms twice.
 */
const PRIMARY = [
  { href: "/avui", label: "Què em poso?" },
  { href: "/armari", label: "Armari" },
  { href: "/bugaderia", label: "Bugaderia" },
];

// The ones you open to look rather than to decide.
const SECONDARY = [
  { href: "/paleta", label: "paletes" },
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
    // One centred block, one quiet footer. The masthead used to sit at the
    // top with the index centred in what was left, which put the title high
    // and opened a hole between the palette rule and the links. Title,
    // rule and index are one composition, so they are centred as one.
    <div className="flex-1 grid grid-rows-[1fr_auto] px-6 pb-8 md:pb-10">
      <Stack as="section" gap={6} align="center" className="self-center text-center">
        <Stack gap={3} align="center">
          <Heading level="display-xl">el meu armari</Heading>
          <Text variant="subtitle" tone="secondary" italic as="p">
            un estudi d&apos;harmonia visual
          </Text>
        </Stack>

        {/* The masthead's rule, in colour. Close enough to the index to
            read as the line between a title and its contents. */}
        <Link
          href="/paleta"
          aria-label={`Paleta ${palette.nombre}`}
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
      </Stack>

      {/* At the foot, not under the index. Three words on one line below a
          column of three read as a fourth, badly aligned row; down here the
          horizontal axis is the whole point and nothing has to agree with
          it. Its own hairline says "this is the other register". */}
      <nav className="justify-self-center flex items-center gap-5 border-t border-border-subtle pt-4 font-serif italic type-small text-text-secondary">
        {SECONDARY.map((entry, i) => (
          <span key={entry.href} className="inline-flex items-center gap-5">
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
    </div>
  );
}
