import { findAllGarments } from "@/lib/prendas/service";
import palettesData from "@/lib/colors/sanzo-wada.json";
import { OutfitBuilder } from "@/components/OutfitBuilder";
import Link from "next/link";
import type { SanzoPalette } from "@/lib/outfits/types";

const palettes = palettesData as SanzoPalette[];

export default async function OutfitsPage() {
  const garments = await findAllGarments();

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Inici
          </Link>
          <h1 className="text-xl font-semibold">Generador d&apos;outfits</h1>
        </div>
        <Link
          href="/outfits/saved"
          className="text-sm px-3 py-1.5 border rounded hover:bg-gray-50"
        >
          Outfits desats
        </Link>
      </div>

      <OutfitBuilder garments={garments} palettes={palettes} />
    </div>
  );
}
