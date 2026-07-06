import { findAllGarments } from "@/lib/prendas/service";
import { findAllOutfits } from "@/lib/outfits/service";
import { bucketOf } from "@/lib/outfits/buckets";
import { Provador } from "@/components/Provador";

export const dynamic = "force-dynamic";

interface SearchParams {
  top?: string;
  bottom?: string;
  shoes?: string;
}

export default async function EmprovadorPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [garments, outfits] = await Promise.all([findAllGarments(), findAllOutfits()]);

  const tops = garments.filter((g) => bucketOf(g.category) === "top");
  const bottoms = garments.filter((g) => bucketOf(g.category) === "bottom");
  const shoes = garments.filter((g) => bucketOf(g.category) === "shoes");

  // Set de claus dels outfits ja desats (independentment de la paleta) per
  // detectar si la combinacio actual ja existeix.
  const savedKeys = outfits.map((o) =>
    o.garments.map((g) => g.garmentId).sort().join("|"),
  );

  return (
    <div
      className="flex flex-col max-w-5xl w-full mx-auto"
      style={{ height: "calc(100dvh - 72px)" }}
    >
      <Provador
        tops={tops}
        bottoms={bottoms}
        shoes={shoes}
        savedKeys={savedKeys}
        initial={{ top: params.top, bottom: params.bottom, shoes: params.shoes }}
      />
    </div>
  );
}
