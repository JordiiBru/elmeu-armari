"use client";

import { useState, useEffect, useRef } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ColorPickers } from "@/components/ColorPickers";
import { SeasonCheckboxes } from "@/components/SeasonCheckboxes";
import { createGarmentAction } from "@/app/add/actions";
import {
  CATEGORIES,
  TEXTURES,
  PATTERNS,
  FITS_BY_CATEGORY,
  SUBTYPES_BY_CATEGORY,
  SIZES_BY_CATEGORY,
} from "@/lib/prendas/types";
import type { Category } from "@/lib/prendas/types";
import {
  CATEGORY_LABELS,
  TEXTURE_LABELS,
  PATTERN_LABELS,
  FIT_LABELS,
  SUBTYPE_LABELS,
} from "@/lib/prendas/labels";
import { UI } from "@/lib/prendas/ui-strings";
import { FORM_STYLES } from "@/lib/ui";
import { Button, TextButton } from "@/components/ui";

export function AddForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createGarmentAction, null);
  const [category, setCategory] = useState<Category | "">("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);

  useEffect(() => {
    if (!state || !("newId" in state) || uploadingRef.current) return;
    uploadingRef.current = true;
    const { newId } = state;

    async function run() {
      if (!imageFile) { router.replace("/armari"); return; }
      setIsUploading(true);
      const fd = new FormData();
      fd.append("file", imageFile);
      try {
        const r = await fetch(`/api/garments/${newId}/image`, { method: "POST", body: fd });
        if (!r.ok) throw new Error();
      } catch {
        setUploadError("La peça s'ha guardat però no s'ha pogut pujar la foto.");
      }
      setIsUploading(false);
      router.replace("/armari");
    }
    run();
  }, [state, imageFile, router]);

  const fits = category ? FITS_BY_CATEGORY[category] : [];
  const subtypes = category ? SUBTYPES_BY_CATEGORY[category] : [];
  const sizes = category ? SIZES_BY_CATEGORY[category] : [];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  return (
    <form action={formAction} className="flex flex-col gap-7">
      {imageFile && <input type="hidden" name="_hasImage" value="1" />}
      <div>
        <label htmlFor="category" className={FORM_STYLES.label}>{UI.form.category} {UI.form.required}</label>
        <select
          id="category"
          name="category"
          required
          className={FORM_STYLES.select}
          value={category}
          onChange={(e) => setCategory(e.target.value as Category | "")}
        >
          <option value="">Selecciona...</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
      </div>

      {category && subtypes.length > 0 && (
        <div>
          <label htmlFor="subtype" className={FORM_STYLES.label}>{UI.form.subtype} {UI.form.required}</label>
          <select id="subtype" name="subtype" required className={FORM_STYLES.select}>
            <option value="">Selecciona...</option>
            {subtypes.map((s) => (
              <option key={s} value={s}>{SUBTYPE_LABELS[s]}</option>
            ))}
          </select>
        </div>
      )}

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
        <select id="size" name="size" required className={FORM_STYLES.select} disabled={!category}>
          <option value="">Selecciona...</option>
          {sizes.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="fit" className={FORM_STYLES.label}>{UI.form.fit} {UI.form.required}</label>
        <select id="fit" name="fit" required className={FORM_STYLES.select} disabled={!category}>
          <option value="">Selecciona...</option>
          {fits.map((f) => (
            <option key={f} value={f}>{FIT_LABELS[f]}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="notes" className={FORM_STYLES.label}>{UI.form.notes}</label>
        <input id="notes" name="notes" placeholder="Opcional..." className={FORM_STYLES.input} />
      </div>

      <div>
        <span className={FORM_STYLES.label}>Foto (opcional)</span>
        <div className="flex flex-col gap-3 mt-2">
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Preview" className="w-32 h-32 object-cover" />
          )}
          <div className="flex items-center gap-3">
            <TextButton
              type="button"
              tone="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              {imageFile ? "canviar foto" : "afegir foto"}
            </TextButton>
            {imageFile && (
              <TextButton
                type="button"
                tone="secondary"
                onClick={() => {
                  setImageFile(null);
                  if (previewUrl) URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                treure
              </TextButton>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {uploadError && (
        <p className="font-serif italic text-sm text-foreground border-t border-foreground pt-3">
          {uploadError}
        </p>
      )}

      {state && "error" in state && (
        <p className="font-serif italic text-sm text-foreground border-t border-foreground pt-3">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={isPending || isUploading}
        loadingText={isUploading ? "pujant foto…" : "guardant…"}
        className="self-start mt-2"
      >
        guardar peça
      </Button>
    </form>
  );
}
