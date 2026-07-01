"use client";

import { useState } from "react";
import { useActionState } from "react";
import { ColorPickers } from "@/components/ColorPickers";
import { SeasonCheckboxes } from "@/components/SeasonCheckboxes";
import { updateGarmentAction } from "@/app/edit/[id]/actions";
import {
  CATEGORIES,
  TEXTURES,
  PATTERNS,
  FITS_BY_CATEGORY,
  SUBTYPES_BY_CATEGORY,
  SIZES_BY_CATEGORY,
} from "@/lib/prendas/types";
import type { GarmentWithColors, Season, Category } from "@/lib/prendas/types";
import {
  CATEGORY_LABELS,
  TEXTURE_LABELS,
  PATTERN_LABELS,
  FIT_LABELS,
  SUBTYPE_LABELS,
} from "@/lib/prendas/labels";
import { UI } from "@/lib/prendas/ui-strings";
import { FORM_STYLES } from "@/lib/ui";

interface Props {
  garment: GarmentWithColors;
  defaultSeasons: Season[];
  defaultHexColors: string[];
}

export function EditForm({ garment, defaultSeasons, defaultHexColors }: Props) {
  const boundAction = updateGarmentAction.bind(null, garment.id);
  const [state, formAction, isPending] = useActionState(boundAction, null);
  const [category, setCategory] = useState<Category>(garment.category);

  const fits = FITS_BY_CATEGORY[category];
  const subtypes = SUBTYPES_BY_CATEGORY[category];
  const sizes = SIZES_BY_CATEGORY[category];

  const defaultFit = fits.includes(garment.fit) ? garment.fit : "";
  const defaultSubtype = garment.subtype && subtypes.includes(garment.subtype) ? garment.subtype : "";
  const defaultSize = sizes.includes(garment.size) ? garment.size : "";

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="category" className={FORM_STYLES.label}>{UI.form.category} {UI.form.required}</label>
        <select
          id="category"
          name="category"
          required
          className={FORM_STYLES.select}
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
      </div>

      {subtypes.length > 0 && (
        <div>
          <label htmlFor="subtype" className={FORM_STYLES.label}>{UI.form.subtype} {UI.form.required}</label>
          <select id="subtype" name="subtype" defaultValue={defaultSubtype} required className={FORM_STYLES.select}>
            <option value="">Selecciona...</option>
            {subtypes.map((s) => (
              <option key={s} value={s}>{SUBTYPE_LABELS[s]}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <span className={FORM_STYLES.label}>{UI.form.colors} {UI.form.required}</span>
        <ColorPickers initialColors={defaultHexColors} />
      </div>

      <div>
        <label htmlFor="texture" className={FORM_STYLES.label}>{UI.form.texture} {UI.form.required}</label>
        <select id="texture" name="texture" defaultValue={garment.texture} required className={FORM_STYLES.select}>
          {TEXTURES.map((t) => (
            <option key={t} value={t}>{TEXTURE_LABELS[t]}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="pattern" className={FORM_STYLES.label}>{UI.form.pattern} {UI.form.required}</label>
        <select id="pattern" name="pattern" defaultValue={garment.pattern} required className={FORM_STYLES.select}>
          {PATTERNS.map((p) => (
            <option key={p} value={p}>{PATTERN_LABELS[p]}</option>
          ))}
        </select>
      </div>

      <div>
        <span className={FORM_STYLES.label}>{UI.form.seasons} {UI.form.required}</span>
        <SeasonCheckboxes defaultValues={defaultSeasons} />
      </div>

      <div>
        <label htmlFor="size" className={FORM_STYLES.label}>{UI.form.size} {UI.form.required}</label>
        <select id="size" name="size" defaultValue={defaultSize} required className={FORM_STYLES.select}>
          <option value="">Selecciona...</option>
          {sizes.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="fit" className={FORM_STYLES.label}>{UI.form.fit} {UI.form.required}</label>
        <select id="fit" name="fit" defaultValue={defaultFit} required className={FORM_STYLES.select}>
          <option value="">Selecciona...</option>
          {fits.map((f) => (
            <option key={f} value={f}>{FIT_LABELS[f]}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="notes" className={FORM_STYLES.label}>{UI.form.notes}</label>
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
        {isPending ? "Guardant..." : UI.buttons.saveChanges}
      </button>
    </form>
  );
}
