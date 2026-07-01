import Link from "next/link";
import { findAllOutfits } from "@/lib/outfits/service";
import palettesData from "@/lib/colors/sanzo-wada.json";
import type { SanzoPalette } from "@/lib/outfits/types";
import { SavedOutfitCard } from "@/components/SavedOutfitCard";

const palettes = palettesData as SanzoPalette[];
const paletteMap = new Map(palettes.map((p) => [p.id, p]));

export default async function SavedOutfitsPage() {
  const outfits = await findAllOutfits();

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/outfits" className="text-sm text-gray-500 hover:text-gray-700">
            ← Generador
          </Link>
          <h1 className="text-xl font-semibold">Outfits desats</h1>
        </div>
      </div>

      {outfits.length === 0 ? (
        <p className="text-sm text-gray-500">
          Encara no has desat cap outfit. Genera combinacions i desa les que t&apos;agradin.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {outfits.map((outfit) => {
            const palette = paletteMap.get(outfit.paletteId);
            return (
              <SavedOutfitCard
                key={outfit.id}
                outfit={outfit}
                palette={palette ?? null}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
