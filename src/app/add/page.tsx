import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorPickers } from "@/components/ColorPickers";
import { TemporadaCheckboxes } from "@/components/TemporadaCheckboxes";
import { createPrendaAction } from "./actions";
import { CATEGORIAS, TEXTURAS, DIBUJOS, FITS } from "@/lib/prendas/types";

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

export default function AddPage() {
  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← Inici
        </Link>
        <h1 className="text-xl font-semibold">Afegir peça</h1>
      </div>

      <form action={createPrendaAction} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="categoria">Categoria *</Label>
          <select id="categoria" name="categoria" required className={selectClass}>
            <option value="">Selecciona...</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {CATEGORIA_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label>Colors *</Label>
          <ColorPickers />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="textura">Textura *</Label>
          <select id="textura" name="textura" required className={selectClass}>
            <option value="">Selecciona...</option>
            {TEXTURAS.map((t) => (
              <option key={t} value={t}>
                {TEXTURA_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dibujo">Dibuix *</Label>
          <select id="dibujo" name="dibujo" required className={selectClass}>
            <option value="">Selecciona...</option>
            {DIBUJOS.map((d) => (
              <option key={d} value={d}>
                {DIBUJO_LABELS[d]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label>Temporada *</Label>
          <TemporadaCheckboxes />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="talla">Talla *</Label>
          <Input id="talla" name="talla" placeholder="M, L, 42..." required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fit">Fit *</Label>
          <select id="fit" name="fit" required className={selectClass}>
            <option value="">Selecciona...</option>
            {FITS.map((f) => (
              <option key={f} value={f}>
                {FIT_LABELS[f]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="nota">Nota</Label>
          <Input id="nota" name="nota" placeholder="Opcional..." />
        </div>

        <Button type="submit" className="w-full">
          Guardar peça
        </Button>
      </form>
    </div>
  );
}
