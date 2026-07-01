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
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Inici
          </Link>
          <h1 className="text-xl font-semibold">El meu armari</h1>
        </div>
        <Link
          href="/add"
          className="text-sm px-3 py-1.5 border rounded hover:bg-gray-50"
        >
          + Afegir peça
        </Link>
      </div>

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
