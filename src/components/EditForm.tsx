"use client";

import { useActionState } from "react";
import { ColorPickers } from "@/components/ColorPickers";
import { TemporadaCheckboxes } from "@/components/TemporadaCheckboxes";
import { updatePrendaAction } from "@/app/edit/[id]/actions";
import { CATEGORIAS, TEXTURAS, DIBUJOS, FITS } from "@/lib/prendas/types";
import {
  CATEGORIA_LABELS,
  TEXTURA_LABELS,
  DIBUJO_LABELS,
  FIT_LABELS,
} from "@/lib/prendas/labels";
import type { PrendaConColores } from "@/lib/prendas/types";

interface Props {
  prenda: PrendaConColores;
  temporadaValues: string[];
  hexColores: string[];
}

const sel =
  "w-full h-8 rounded-lg border border-gray-300 bg-white px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black";
const inp =
  "w-full h-8 rounded-lg border border-gray-300 bg-white px-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black";
const lbl = "block text-sm font-medium mb-1";

export function EditForm({ prenda, temporadaValues, hexColores }: Props) {
  const boundAction = updatePrendaAction.bind(null, prenda.id);
  const [state, formAction, isPending] = useActionState(boundAction, null);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="categoria" className={lbl}>Categoria *</label>
        <select id="categoria" name="categoria" defaultValue={prenda.categoria} required className={sel}>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{CATEGORIA_LABELS[c]}</option>
          ))}
        </select>
      </div>

      <div>
        <span className={lbl}>Colors *</span>
        <ColorPickers initialColors={hexColores} />
      </div>

      <div>
        <label htmlFor="textura" className={lbl}>Textura *</label>
        <select id="textura" name="textura" defaultValue={prenda.textura} required className={sel}>
          {TEXTURAS.map((t) => (
            <option key={t} value={t}>{TEXTURA_LABELS[t]}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="dibujo" className={lbl}>Dibuix *</label>
        <select id="dibujo" name="dibujo" defaultValue={prenda.dibujo} required className={sel}>
          {DIBUJOS.map((d) => (
            <option key={d} value={d}>{DIBUJO_LABELS[d]}</option>
          ))}
        </select>
      </div>

      <div>
        <span className={lbl}>Temporada *</span>
        <TemporadaCheckboxes defaultValues={temporadaValues} />
      </div>

      <div>
        <label htmlFor="talla" className={lbl}>Talla *</label>
        <input id="talla" name="talla" defaultValue={prenda.talla} required className={inp} />
      </div>

      <div>
        <label htmlFor="fit" className={lbl}>Fit *</label>
        <select id="fit" name="fit" defaultValue={prenda.fit} required className={sel}>
          {FITS.map((f) => (
            <option key={f} value={f}>{FIT_LABELS[f]}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="nota" className={lbl}>Nota</label>
        <input id="nota" name="nota" defaultValue={prenda.nota ?? ""} className={inp} />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-9 rounded-lg bg-black text-white text-sm font-medium hover:bg-black/80 disabled:opacity-50 transition-opacity"
      >
        {isPending ? "Guardant..." : "Guardar canvis"}
      </button>
    </form>
  );
}
