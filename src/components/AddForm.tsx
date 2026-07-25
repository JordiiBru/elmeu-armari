"use client";

import { useState, useEffect, useRef } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ColorPickers } from "@/components/ColorPickers";
import { SeasonCheckboxes } from "@/components/SeasonCheckboxes";
import { createGarmentAction } from "@/app/add/actions";
import {
  CATEGORIES,
  FITS_BY_CATEGORY,
  SUBTYPES_BY_CATEGORY,
  SIZES_BY_CATEGORY,
  LENGTHS_BY_CATEGORY,
  TEXTURES_BY_CATEGORY,
  PATTERNS_BY_CATEGORY,
  CATEGORIES_WITH_OPTIONAL_COLOR,
} from "@/lib/prendas/types";
import type { Category } from "@/lib/prendas/types";
import {
  CATEGORY_LABELS,
  TEXTURE_LABELS,
  PATTERN_LABELS,
  FIT_LABELS,
  SUBTYPE_LABELS,
  LENGTH_LABELS,
} from "@/lib/prendas/labels";
import { UI } from "@/lib/prendas/ui-strings";
import {
  Button,
  TextButton,
  Field,
  Input,
  Select,
  Text,
  Stack,
} from "@/components/ui";

export function AddForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    createGarmentAction,
    null,
  );
  const [category, setCategory] = useState<Category | "">("");
  const [subtype, setSubtype] = useState("");
  const [length, setLength] = useState("");
  const [texture, setTexture] = useState("");
  const [pattern, setPattern] = useState("");
  const [size, setSize] = useState("");
  const [fit, setFit] = useState("");
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
      if (!imageFile) {
        router.replace("/armari");
        return;
      }
      setIsUploading(true);
      const fd = new FormData();
      fd.append("file", imageFile);
      try {
        const r = await fetch(`/api/garments/${newId}/image`, {
          method: "POST",
          body: fd,
        });
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
  const lengths = category ? LENGTHS_BY_CATEGORY[category] : [];
  const textures = category ? TEXTURES_BY_CATEGORY[category] : [];
  const patterns = category ? PATTERNS_BY_CATEGORY[category] : [];
  const colorsRequired = !category || !CATEGORIES_WITH_OPTIONAL_COLOR.has(category);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  return (
    <form action={formAction} className="flex flex-col gap-7">
      {imageFile && <input type="hidden" name="_hasImage" value="1" />}

      <Field label={UI.form.category} required>
        <Select
          name="category"
          required
          value={category}
          onChange={(v) => {
            setCategory(v as Category);
            setSubtype("");
            setLength("");
            setSize("");
            setFit("");
            setTexture("");
            setPattern("");
          }}
          options={CATEGORIES.map((c) => ({
            value: c,
            label: CATEGORY_LABELS[c],
          }))}
        />
      </Field>

      {category && subtypes.length > 0 && (
        <Field label={UI.form.subtype} required>
          <Select
            name="subtype"
            required
            value={subtype}
            onChange={setSubtype}
            options={subtypes.map((s) => ({
              value: s,
              label: SUBTYPE_LABELS[s],
            }))}
          />
        </Field>
      )}

      {category && lengths.length > 0 && (
        <Field label={UI.form.length} required>
          <Select
            name="length"
            required
            value={length}
            onChange={setLength}
            options={lengths.map((l) => ({
              value: l,
              label: LENGTH_LABELS[l],
            }))}
          />
        </Field>
      )}

      <Field label={UI.form.colors} required={colorsRequired}>
        <ColorPickers />
      </Field>

      {category && textures.length > 0 && (
        <Field label={UI.form.texture} required>
          <Select
            name="texture"
            required
            value={texture}
            onChange={setTexture}
            options={textures.map((t) => ({
              value: t,
              label: TEXTURE_LABELS[t],
            }))}
          />
        </Field>
      )}

      {category && patterns.length > 0 && (
        <Field label={UI.form.pattern} required>
          <Select
            name="pattern"
            required
            value={pattern}
            onChange={setPattern}
            options={patterns.map((p) => ({
              value: p,
              label: PATTERN_LABELS[p],
            }))}
          />
        </Field>
      )}

      <Field label={UI.form.seasons} required>
        <SeasonCheckboxes />
      </Field>

      {category && sizes.length > 0 && (
        <Field label={UI.form.size} required>
          <Select
            name="size"
            required
            value={size}
            onChange={setSize}
            options={sizes.map((s) => ({ value: s, label: s }))}
          />
        </Field>
      )}

      {category && fits.length > 0 && (
        <Field label={UI.form.fit} required>
          <Select
            name="fit"
            required
            value={fit}
            onChange={setFit}
            options={fits.map((f) => ({ value: f, label: FIT_LABELS[f] }))}
          />
        </Field>
      )}

      <Field label={UI.form.notes} htmlFor="notes">
        <Input id="notes" name="notes" placeholder="opcional…" />
      </Field>

      <Stack gap={3}>
        <Text variant="caption" as="span">Foto (opcional)</Text>
        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Preview" className="w-32 h-32 object-cover" />
        )}
        <div className="flex items-center gap-4">
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
      </Stack>

      {uploadError && (
        <Text variant="small" italic className="font-serif border-t border-border-strong pt-3">
          {uploadError}
        </Text>
      )}

      {state && "error" in state && (
        <Text variant="small" italic className="font-serif text-danger border-t border-danger pt-3">
          {state.error}
        </Text>
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
