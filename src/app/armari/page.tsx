import { Suspense } from "react";

export const dynamic = "force-dynamic";
import Link from "next/link";
import { findAllGarments } from "@/lib/prendas/service";
import { findAllOutfits } from "@/lib/outfits/service";
import palettesData from "@/lib/colors/sanzo-wada.json";
import type { SanzoPalette } from "@/lib/outfits/types";
import { ArmariTabs } from "@/components/ArmariTabs";

const palettes = palettesData as SanzoPalette[];

export default async function ArmariPage() {
  const [garments, outfits] = await Promise.all([
    findAllGarments(),
    findAllOutfits(),
  ]);

  const savedOutfits = outfits.map((o) => ({
    id: o.id,
    name: o.name,
    paletteId: o.paletteId,
    createdAt: o.createdAt,
    garments: o.garments.map((og) => ({
      id: og.id,
      garment: og.garment,
    })),
  }));

  return (
    <div className="max-w-5xl mx-auto w-full px-6 md:px-10 pb-24">
      <header className="pt-6 pb-14 md:pb-20 flex flex-col gap-8">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] tracking-[0.25em] uppercase text-foreground-secondary">
            arxiu
          </span>
          <Link
            href="/add"
            className="font-serif italic text-sm text-foreground-secondary hover:text-foreground"
          >
            afegir una peça
          </Link>
        </div>
        <h1 className="font-serif text-5xl md:text-6xl tracking-tight leading-[0.95]">
          el meu armari
        </h1>
        <p className="font-serif italic text-base text-foreground-secondary max-w-md">
          {garments.length === 0
            ? "encara no hi ha res desat."
            : `${garments.length} peces registrades.`}
        </p>
      </header>

      <Suspense>
        <ArmariTabs
          garments={garments}
          palettes={palettes}
          savedOutfits={savedOutfits}
        />
      </Suspense>
    </div>
  );
}
