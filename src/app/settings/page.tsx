import Link from "next/link";
import { ImportForm } from "@/components/ImportForm";
import { findAllGarments } from "@/lib/prendas/service";

export default async function SettingsPage() {
  const garments = await findAllGarments();

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Inici</Link>
        <h1 className="text-xl font-semibold">Configuració</h1>
      </div>

      {/* Export */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Exportar dades</h2>
        <p className="text-sm text-gray-500">
          Descarrega totes les teves peces en format JSON. Útil com a backup o per migrar a un altre dispositiu.
        </p>
        <p className="text-xs text-gray-400">{garments.length} peces al teu armari</p>
        <a
          href="/api/export"
          download
          className="inline-block px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
        >
          Descarregar JSON
        </a>
      </section>

      <hr className="border-gray-100" />

      {/* Import */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Importar dades</h2>
        <p className="text-sm text-gray-500">
          Puja un fitxer JSON exportat prèviament. Tria el mode:
        </p>
        <ImportForm />
      </section>
    </div>
  );
}
