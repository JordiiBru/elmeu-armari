import Link from "next/link";
import { findAllGarments } from "@/lib/prendas/service";
import { findAllOutfits } from "@/lib/outfits/service";
import type { GarmentWithColors } from "@/lib/prendas/types";
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

// Fisher–Yates sample. Runs on the server per request (page is
// force-dynamic) so every visit shows a different curation.
function sample<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

// Editorial size pattern: three tiers in a fixed, magazine-like
// rhythm. Only the *selection* rotates — the composition stays calm.
const MOBILE_SIZES = [
  "h-14 w-11",
  "h-16 w-12",
  "h-14 w-11",
  "h-12 w-9",
  "h-16 w-12",
  "h-14 w-11",
];

const DESKTOP_SIZES = [
  "md:h-16 md:w-12",
  "md:h-24 md:w-[4.5rem]",
  "md:h-14 md:w-11",
  "md:h-20 md:w-15",
  "md:h-16 md:w-12",
  "md:h-12 md:w-9",
  "md:h-22 md:w-16",
  "md:h-16 md:w-12",
  "md:h-14 md:w-11",
  "md:h-18 md:w-14",
];

function Strip({
  garments,
  variant,
}: {
  garments: GarmentWithColors[];
  variant: "mobile" | "desktop";
}) {
  const sizes = variant === "mobile" ? MOBILE_SIZES : DESKTOP_SIZES;
  return (
    <div
      className={[
        "flex items-end gap-3",
        variant === "mobile" ? "md:hidden" : "hidden md:flex md:gap-4",
      ].join(" ")}
      aria-label="Peces del catàleg"
    >
      {garments.map((g, i) => (
        <PieceThumb
          key={g.id}
          garment={g}
          thumb
          className={sizes[i % sizes.length]}
        />
      ))}
    </div>
  );
}

export default async function HomePage() {
  const [garments, outfits] = await Promise.all([
    findAllGarments(),
    findAllOutfits(),
  ]);

  const empty = garments.length === 0;
  const mobileCount = 6;
  const desktopCount = 10;
  const mobileSample = sample(garments, mobileCount);
  const desktopSample = sample(garments, desktopCount);

  return (
    <div className="flex-1 grid grid-rows-[1fr_auto_1fr] px-6 py-12 md:py-20">
      <Stack as="section" gap={5} align="center" className="self-end text-center">
        <Heading level="display-xl">el meu armari</Heading>
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
            {mobileSample.length > 0 && (
              <>
                <Strip garments={mobileSample} variant="mobile" />
                <Strip garments={desktopSample} variant="desktop" />
              </>
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
