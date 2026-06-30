import Link from "next/link";
import paletes from "@/lib/colores/sanzo-wada.json";

export default function PaletaPage() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← Inici
        </Link>
        <h1 className="text-xl font-semibold">Paletes Sanzo Wada</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {paletes.map((paleta) => (
          <div key={paleta.id} className="border rounded overflow-hidden">
            <div className="flex h-14">
              {paleta.colores.map((hex, i) => (
                <div
                  key={i}
                  className="flex-1"
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
              ))}
            </div>
            <div className="p-2">
              <p className="text-sm font-medium">{paleta.nombre}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {paleta.colores.map((hex, i) => (
                  <span key={i} className="text-xs font-mono text-gray-500">
                    {hex}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
