"use client";

import { useState, useRef } from "react";
import Image from "next/image";
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
  LENGTHS_BY_CATEGORY,
} from "@/lib/prendas/types";
import type { GarmentWithColors, Season, Category } from "@/lib/prendas/types";
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

interface Props {
  garment: GarmentWithColors;
  defaultSeasons: Season[];
  defaultHexColors: string[];
}

export function EditForm({ garment, defaultSeasons, defaultHexColors }: Props) {
  const boundAction = updateGarmentAction.bind(null, garment.id);
  const [state, formAction, isPending] = useActionState(boundAction, null);
  const [category, setCategory] = useState<Category>(garment.category);
  const initialFits = FITS_BY_CATEGORY[garment.category];
  const initialSubtypes = SUBTYPES_BY_CATEGORY[garment.category];
  const initialSizes = SIZES_BY_CATEGORY[garment.category];
  const initialLengths = LENGTHS_BY_CATEGORY[garment.category];
  const [subtype, setSubtype] = useState<string>(
    garment.subtype && initialSubtypes.includes(garment.subtype)
      ? garment.subtype
      : "",
  );
  const [length, setLength] = useState<string>(
    garment.length && initialLengths.includes(garment.length)
      ? garment.length
      : "",
  );
  const [texture, setTexture] = useState<string>(garment.texture);
  const [pattern, setPattern] = useState<string>(garment.pattern);
  const [size, setSize] = useState<string>(
    initialSizes.includes(garment.size) ? garment.size : "",
  );
  const [fit, setFit] = useState<string>(
    initialFits.includes(garment.fit) ? garment.fit : "",
  );
  const [currentImage, setCurrentImage] = useState<string | null>(garment.image);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState<"idle" | "uploading" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setImageStatus("uploading");
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch(`/api/garments/${garment.id}/image`, {
      method: "POST",
      body: fd,
    });
    if (r.ok) {
      const data = await r.json();
      setCurrentImage(data.image);
      setImageStatus("idle");
    } else {
      setImageStatus("error");
    }
  }

  async function handleDeleteImage() {
    setImageStatus("uploading");
    const r = await fetch(`/api/garments/${garment.id}/image`, {
      method: "DELETE",
    });
    if (r.ok) {
      setCurrentImage(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    setImageStatus("idle");
  }

  const fits = FITS_BY_CATEGORY[category];
  const subtypes = SUBTYPES_BY_CATEGORY[category];
  const sizes = SIZES_BY_CATEGORY[category];
  const lengths = LENGTHS_BY_CATEGORY[category];

  return (
    <form action={formAction} className="flex flex-col gap-7">
      <Field label={UI.form.category} required>
        <Select
          name="category"
          required
          value={category}
          onChange={(v) => {
            const next = v as Category;
            setCategory(next);
            if (!SUBTYPES_BY_CATEGORY[next].includes(subtype)) setSubtype("");
            if (!LENGTHS_BY_CATEGORY[next].includes(length)) setLength("");
            if (!SIZES_BY_CATEGORY[next].includes(size)) setSize("");
            if (!FITS_BY_CATEGORY[next].includes(fit)) setFit("");
          }}
          options={CATEGORIES.map((c) => ({
            value: c,
            label: CATEGORY_LABELS[c],
          }))}
        />
      </Field>

      {subtypes.length > 0 && (
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

      {lengths.length > 0 && (
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

      <Field label={UI.form.colors} required>
        <ColorPickers initialColors={defaultHexColors} />
      </Field>

      <Field label={UI.form.texture} required>
        <Select
          name="texture"
          required
          value={texture}
          onChange={setTexture}
          options={TEXTURES.map((t) => ({
            value: t,
            label: TEXTURE_LABELS[t],
          }))}
        />
      </Field>

      <Field label={UI.form.pattern} required>
        <Select
          name="pattern"
          required
          value={pattern}
          onChange={setPattern}
          options={PATTERNS.map((p) => ({
            value: p,
            label: PATTERN_LABELS[p],
          }))}
        />
      </Field>

      <Field label={UI.form.seasons} required>
        <SeasonCheckboxes defaultValues={defaultSeasons} />
      </Field>

      <Field label={UI.form.size} required>
        <Select
          name="size"
          required
          value={size}
          onChange={setSize}
          options={sizes.map((s) => ({ value: s, label: s }))}
        />
      </Field>

      <Field label={UI.form.fit} required>
        <Select
          name="fit"
          required
          value={fit}
          onChange={setFit}
          options={fits.map((f) => ({ value: f, label: FIT_LABELS[f] }))}
        />
      </Field>

      <Field label={UI.form.notes} htmlFor="notes">
        <Input
          id="notes"
          name="notes"
          defaultValue={garment.notes ?? ""}
          placeholder="opcional…"
        />
      </Field>

      <Stack gap={3}>
        <Text variant="caption" as="span">Foto (opcional)</Text>
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Preview" className="w-32 h-32 object-cover" />
        ) : currentImage ? (
          <div className="relative w-32 h-32">
            <Image
              src={`/api/uploads/${currentImage}?v=${garment.updatedAt.getTime()}`}
              alt="Foto actual"
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        ) : null}
        <div className="flex items-center gap-4">
          <TextButton
            type="button"
            tone="secondary"
            disabled={imageStatus === "uploading"}
            onClick={() => fileInputRef.current?.click()}
          >
            {imageStatus === "uploading"
              ? "pujant…"
              : currentImage
                ? "canviar foto"
                : "afegir foto"}
          </TextButton>
          {currentImage && imageStatus !== "uploading" && (
            <TextButton type="button" tone="secondary" onClick={handleDeleteImage}>
              treure foto
            </TextButton>
          )}
        </div>
        {imageStatus === "error" && (
          <Text variant="small" italic tone="secondary" className="font-serif">
            No s&apos;ha pogut pujar la foto. Torna-ho a provar.
          </Text>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </Stack>

      {state?.error && (
        <Text variant="small" italic className="font-serif text-danger border-t border-danger pt-3">
          {state.error}
        </Text>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={isPending}
        loadingText="guardant…"
        className="self-start mt-2"
      >
        guardar canvis
      </Button>
    </form>
  );
}
