import { notFound } from "next/navigation";
import Link from "next/link";
import { findGarmentById } from "@/lib/prendas/service";
import { EditForm } from "@/components/EditForm";

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const garment = await findGarmentById(id);
  if (!garment) notFound();

  const serialized = garment;

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/armari" className="text-sm text-gray-500 hover:text-gray-700">← Armari</Link>
        <h1 className="text-xl font-semibold">Editar peça</h1>
      </div>
      <EditForm
        garment={serialized}
        defaultSeasons={garment.seasons.map((s) => s.season)}
        defaultHexColors={garment.colors.map((c) => c.hex)}
      />
    </div>
  );
}
