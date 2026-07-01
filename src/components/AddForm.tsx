"use client";

import { useActionState } from "react";
import { ColorPickers } from "@/components/ColorPickers";
import { SeasonCheckboxes } from "@/components/SeasonCheckboxes";
import { createGarmentAction } from "@/app/add/actions";
import { CATEGORIES, TEXTURES, PATTERNS, FITS } from "@/lib/prendas/types";
import {
  CATEGORY_LABELS,
  TEXTURE_LABELS,
  PATTERN_LABELS,
  FIT_LABELS,
} from "@/lib/prendas/labels";
import { UI } from "@/lib/prendas/ui-strings";
import { FORM_STYLES } from "@/lib/ui";

export function AddForm() {
  const [state, formAction, isPending] = useActionState(createGarmentAction, null);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="category" className={FORM_STYLES.label}>{UI.form.category} {UI.form.required}</label>
        <select id="category" name="category" required className={FORM_STYLES.select}>
          <option value="">Selecciona...</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
      </div>

      <div>
        <span className={FORM_STYLES.label}>{UI.form.colors} {UI.form.required}</span>
        <ColorPickers />
      </div>

      <div>
        <label htmlFor="texture" className={FORM_STYLES.label}>{UI.form.texture} {UI.form.required}</label>
        <select id="texture" name="texture" required className={FORM_STYLES.select}>
          <option value="">Selecciona...</option>
          {TEXTURES.map((t) => (
            <option key={t} value={t}>{TEXTURE_LABELS[t]}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="pattern" className={FORM_STYLES.label}>{UI.form.pattern} {UI.form.required}</label>
        <select id="pattern" name="pattern" required className={FORM_STYLES.select}>
          <option value="">Selecciona...</option>
          {PATTERNS.map((p) => (
            <option key={p} value={p}>{PATTERN_LABELS[p]}</option>
          ))}
        </select>
      </div>

      <div>
        <span className={FORM_STYLES.label}>{UI.form.seasons} {UI.form.required}</span>
        <SeasonCheckboxes />
      </div>

      <div>
        <label htmlFor="size" className={FORM_STYLES.label}>{UI.form.size} {UI.form.required}</label>
        <input id="size" name="size" placeholder="M, L, 42..." required className={FORM_STYLES.input} />
      </div>

      <div>
        <label htmlFor="fit" className={FORM_STYLES.label}>{UI.form.fit} {UI.form.required}</label>
        <select id="fit" name="fit" required className={FORM_STYLES.select}>
          <option value="">Selecciona...</option>
          {FITS.map((f) => (
            <option key={f} value={f}>{FIT_LABELS[f]}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="notes" className={FORM_STYLES.label}>{UI.form.notes}</label>
        <input id="notes" name="notes" placeholder="Opcional..." className={FORM_STYLES.input} />
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
        {isPending ? "Guardant..." : UI.buttons.save}
      </button>
    </form>
  );
}
