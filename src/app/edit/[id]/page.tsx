import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorPickersEdit } from "@/components/ColorPickersEdit";
import { TemporadaCheckboxes } from "@/components/TemporadaCheckboxes";
import { findPrendaById, parseTemporada } from "@/lib/prendas/service";
import { CATEGORIAS, TEXTURAS, DIBUJOS, FITS } from "@/lib/prendas/types";
import { updatePrendaAction } from "./actions";

const CATEGORIA_LABELS: Record<string, string> = {
  JERSEI: "Jersei",
  CAMISA: "Camisa",
  PANTALONES: "Pantalons",
  CALCETINES: "Calcetins",
  ZAPATOS: "Sabates",
};
const TEXTURA_LABELS: Record<string, string> = {
  PUNTO: "Punt",
  DENIM: "Denim",
  LINO: "Lli",
  ALGODON: "Cotó",
  POLIESTER: "Poliester",
  CUERO: "Cuir",
  SINTETICO: "Sintètic",
};
const DIBUJO_LABELS: Record<string, string> = {
  LISO: "Llis",
  RAYAS: "Ratlles",
  CUADROS: "Quadres",
  FLORES: "Flors",
  ESTAMPADO: "Estampat",
  GEOMETRICO: "Geomètric",
};
const FIT_LABELS: Record<string, string> = {
  OVERSIZED: "Oversized",
  STRAIGHT: "Straight",
  CROPPED: "Cropped",
  SLIM: "Slim",
  BAGGY: "Baggy",
  REGULAR: "Regular",
};

const selectClass =
  "w-full h-8 rounded-lg border border-input bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-3 focus:ring-ring/50 focus:border-ring";

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const prenda = await findPrendaById(id);
  if (!prenda) notFound();

  const temporadaValues = parseTemporada(prenda.temporada);
  const hexColores = prenda.colores.map((c) => c.hex);

  const action = updatePrendaAction.bind(null, id);

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/armari" className="text-sm text-gray-500 hover:text-gray-700">
          ← Armari
        </Link>
        <h1 className="text-xl font-semibold">Editar peça</h1>
      </div>

      <form action={action} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="categoria">Categoria *</Label>
          <select
            id="categoria"
            name="categoria"
            defaultValue={prenda.categoria}
            required
            className={selectClass}
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {CATEGORIA_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label>Colors *</Label>
          <ColorPickersEdit initialColors={hexColores} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="textura">Textura *</Label>
          <select
            id="textura"
            name="textura"
            defaultValue={prenda.textura}
            required
            className={selectClass}
          >
            {TEXTURAS.map((t) => (
              <option key={t} value={t}>
                {TEXTURA_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dibujo">Dibuix *</Label>
          <select
            id="dibujo"
            name="dibujo"
            defaultValue={prenda.dibujo}
            required
            className={selectClass}
          >
            {DIBUJOS.map((d) => (
              <option key={d} value={d}>
                {DIBUJO_LABELS[d]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label>Temporada *</Label>
          <TemporadaCheckboxes defaultValues={temporadaValues} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="talla">Talla *</Label>
          <Input
            id="talla"
            name="talla"
            defaultValue={prenda.talla}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fit">Fit *</Label>
          <select
            id="fit"
            name="fit"
            defaultValue={prenda.fit}
            required
            className={selectClass}
          >
            {FITS.map((f) => (
              <option key={f} value={f}>
                {FIT_LABELS[f]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="nota">Nota</Label>
          <Input
            id="nota"
            name="nota"
            defaultValue={prenda.nota ?? ""}
          />
        </div>

        <Button type="submit" className="w-full">
          Guardar canvis
        </Button>
      </form>
    </div>
  );
}
