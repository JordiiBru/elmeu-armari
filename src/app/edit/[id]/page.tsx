import { notFound } from "next/navigation";
import Link from "next/link";
import { findPrendaById, parseTemporada } from "@/lib/prendas/service";
import { EditForm } from "@/components/EditForm";

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const prenda = await findPrendaById(id);
  if (!prenda) notFound();

  const serialized = {
    ...prenda,
    createdAt: prenda.createdAt.toISOString(),
    updatedAt: prenda.updatedAt.toISOString(),
    colores: prenda.colores.map(({ id, hex }) => ({ id, hex })),
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/armari" className="text-sm text-gray-500 hover:text-gray-700">← Armari</Link>
        <h1 className="text-xl font-semibold">Editar peça</h1>
      </div>
      <EditForm
        prenda={serialized}
        temporadaValues={parseTemporada(prenda.temporada)}
        hexColores={prenda.colores.map((c) => c.hex)}
      />
    </div>
  );
}
