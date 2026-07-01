import Link from "next/link";
import { findAllPrendas } from "@/lib/prendas/service";
import { ArmariGrid } from "@/components/ArmariGrid";

export default async function ArmariPage() {
  const raw = await findAllPrendas();

  const prendas = raw.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    colores: p.colores.map(({ id, hex }) => ({ id, hex })),
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

      <ArmariGrid prendas={prendas} />
    </div>
  );
}
