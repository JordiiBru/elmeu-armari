"use client";

import { useActionState } from "react";
import { ColorPickers } from "@/components/ColorPickers";
import { SeasonCheckboxes } from "@/components/SeasonCheckboxes";
import { updateGarmentAction } from "@/app/edit/[id]/actions";
import { CATEGORIES, TEXTURES, PATTERNS, FITS } from "@/lib/prendas/types";
import {
  CATEGORY_LABELS,
  TEXTURE_LABELS,
  PATTERN_LABELS,
  FIT_LABELS,
} from "@/lib/prendas/labels";
import { FORM_STYLES } from "@/lib/ui";
import type { GarmentWithColors, Season } from "@/lib/prendas/types";

interface Props {
  garment: GarmentWithColors;
  defaultSeasons: Season[];
  defaultHexColors: string[];
}

export function EditForm({ garment, defaultSeasons, defaultHexColors }: Props) {
  const boundAction = updateGarmentAction.bind(null, garment.id);
  const [state, formAction, isPending] = useActionState(boundAction, null);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="category" className={FORM_STYLES.label}>Categoria *</label>
        <select id="category" name="category" defaultValue={garment.category} required className={FORM_STYLES.select}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
      </div>

      <div>
        <span className={FORM_STYLES.label}>Colors *</span>
        <ColorPickers initialColors={defaultHexColors} />
      </div>

      <div>
        <label htmlFor="texture" className={FORM_STYLES.label}>Textura *</label>
        <select id="texture" name="texture" defaultValue={garment.texture} required className={FORM_STYLES.select}>
          {TEXTURES.map((t) => (
            <option key={t} value={t}>{TEXTURE_LABELS[t]}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="pattern" className={FORM_STYLES.label}>Dibuix *</label>
        <select id="pattern" name="pattern" defaultValue={garment.pattern} required className={FORM_STYLES.select}>
          {PATTERNS.map((p) => (
            <option key={p} value={p}>{PATTERN_LABELS[p]}</option>
          ))}
        </select>
      </div>

      <div>
        <span className={FORM_STYLES.label}>Temporada *</span>
        <SeasonCheckboxes defaultValues={defaultSeasons} />
      </div>

      <div>
        <label htmlFor="size" className={FORM_STYLES.label}>Talla *</label>
        <input id="size" name="size" defaultValue={garment.size} required className={FORM_STYLES.input} />
      </div>

      <div>
        <label htmlFor="fit" className={FORM_STYLES.label}>Fit *</label>
        <select id="fit" name="fit" defaultValue={garment.fit} required className={FORM_STYLES.select}>
          {FITS.map((f) => (
            <option key={f} value={f}>{FIT_LABELS[f]}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="notes" className={FORM_STYLES.label}>Nota</label>
        <input id="notes" name="notes" defaultValue={garment.notes ?? ""} className={FORM_STYLES.input} />
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
