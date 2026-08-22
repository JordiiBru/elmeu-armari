"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { ColorPickers } from "@/components/ColorPickers";
import { SeasonCheckboxes } from "@/components/SeasonCheckboxes";
import { updateGarmentAction } from "@/app/edit/[id]/actions";
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
import type { GarmentWithColors, Season, Category, Texture, Pattern } from "@/lib/prendas/types";
import { optionLabel } from "@/lib/prendas/labels";
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
  const t = useTranslations("form");
  const tLabel = useTranslations("labels");
  const tPhoto = useTranslations("photo");
  const tError = useTranslations("errors");
  const boundAction = updateGarmentAction.bind(null, garment.id);
  const [state, formAction, isPending] = useActionState(boundAction, null);
  const [category, setCategory] = useState<Category>(garment.category);
  const initialFits = FITS_BY_CATEGORY[garment.category];
  const initialSubtypes = SUBTYPES_BY_CATEGORY[garment.category];
  const initialSizes = SIZES_BY_CATEGORY[garment.category];
  const initialLengths = LENGTHS_BY_CATEGORY[garment.category];
  const initialTextures = TEXTURES_BY_CATEGORY[garment.category];
  const initialPatterns = PATTERNS_BY_CATEGORY[garment.category];
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
  const [texture, setTexture] = useState<string>(
    garment.texture && initialTextures.includes(garment.texture) ? garment.texture : "",
  );
  const [pattern, setPattern] = useState<string>(
    garment.pattern && initialPatterns.includes(garment.pattern) ? garment.pattern : "",
  );
  const [size, setSize] = useState<string>(
    garment.size && initialSizes.includes(garment.size) ? garment.size : "",
  );
  const [fit, setFit] = useState<string>(
    garment.fit && initialFits.includes(garment.fit) ? garment.fit : "",
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
  const textures = TEXTURES_BY_CATEGORY[category];
  const patterns = PATTERNS_BY_CATEGORY[category];
  const colorsRequired = !CATEGORIES_WITH_OPTIONAL_COLOR.has(category);

  return (
    <form action={formAction} className="flex flex-col gap-7">
      <Field label={t("category")} required>
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
            if (!TEXTURES_BY_CATEGORY[next].includes(texture as Texture)) setTexture("");
            if (!PATTERNS_BY_CATEGORY[next].includes(pattern as Pattern)) setPattern("");
          }}
          options={CATEGORIES.map((c) => ({
            value: c,
            label: tLabel(`category.${c}`),
          }))}
        />
      </Field>

      {subtypes.length > 0 && (
        <Field label={t("subtype")} required>
          <Select
            name="subtype"
            required
            value={subtype}
            onChange={setSubtype}
            options={subtypes.map((s) => ({
              value: s,
              label: optionLabel(tLabel, "subtype", s),
            }))}
          />
        </Field>
      )}

      {lengths.length > 0 && (
        <Field label={t("length")} required>
          <Select
            name="length"
            required
            value={length}
            onChange={setLength}
            options={lengths.map((l) => ({
              value: l,
              label: optionLabel(tLabel, "length", l),
            }))}
          />
        </Field>
      )}

      <Field label={t("colors")} required={colorsRequired}>
        <ColorPickers initialColors={defaultHexColors} />
      </Field>

      {textures.length > 0 && (
        <Field label={t("texture")} required>
          <Select
            name="texture"
            required
            value={texture}
            onChange={setTexture}
            options={textures.map((t) => ({
              value: t,
              label: tLabel(`texture.${t}`),
            }))}
          />
        </Field>
      )}

      {patterns.length > 0 && (
        <Field label={t("pattern")} required>
          <Select
            name="pattern"
            required
            value={pattern}
            onChange={setPattern}
            options={patterns.map((p) => ({
              value: p,
              label: tLabel(`pattern.${p}`),
            }))}
          />
        </Field>
      )}

      <Field label={t("seasons")} required>
        <SeasonCheckboxes defaultValues={defaultSeasons} />
      </Field>

      {sizes.length > 0 && (
        <Field label={t("size")} required>
          <Select
            name="size"
            required
            value={size}
            onChange={setSize}
            options={sizes.map((s) => ({ value: s, label: s }))}
          />
        </Field>
      )}

      {fits.length > 0 && (
        <Field label={t("fit")} required>
          <Select
            name="fit"
            required
            value={fit}
            onChange={setFit}
            options={fits.map((f) => ({ value: f, label: optionLabel(tLabel, "fit", f) }))}
          />
        </Field>
      )}

      <Field label={t("notes")} htmlFor="notes">
        <Input
          id="notes"
          name="notes"
          defaultValue={garment.notes ?? ""}
          placeholder={t("notesPlaceholder")}
        />
      </Field>

      <Stack gap={3}>
        <Text variant="caption" as="span">{tPhoto("label")}</Text>
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={tPhoto("previewAlt")} className="w-32 h-32 object-cover" />
        ) : currentImage ? (
          <div className="relative w-32 h-32">
            <Image
              src={`/api/uploads/${currentImage}?v=${garment.updatedAt.getTime()}`}
              alt={tPhoto("currentAlt")}
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
              ? tPhoto("uploading")
              : currentImage
                ? tPhoto("change")
                : tPhoto("add")}
          </TextButton>
          {currentImage && imageStatus !== "uploading" && (
            <TextButton type="button" tone="secondary" onClick={handleDeleteImage}>
              {tPhoto("removeCurrent")}
            </TextButton>
          )}
        </div>
        {imageStatus === "error" && (
          <Text variant="small" italic tone="secondary" className="font-serif">
            {tPhoto("uploadFailed")}
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
          {tError(state.error)}
        </Text>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={isPending}
        loadingText={t("saving")}
        className="self-start mt-2"
      >
        {t("saveChanges")}
      </Button>
    </form>
  );
}
