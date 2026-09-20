"use client";

import { useState, useEffect, useRef } from "react";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ColorPickers } from "@/components/ColorPickers";
import { SeasonCheckboxes } from "@/components/SeasonCheckboxes";
import { createGarmentAction } from "@/app/add/actions";
import { shrinkForUpload } from "@/lib/image-client";
import { suggestColours } from "@/lib/colors/from-photo";
import {
  CATEGORIES,
  FITS_BY_CATEGORY,
  SUBTYPES_BY_CATEGORY,
  SIZES_BY_CATEGORY,
  LENGTHS_BY_CATEGORY,
  TEXTURES_BY_CATEGORY,
  PATTERNS_BY_CATEGORY,
  lengthRequired,
  CATEGORIES_WITH_OPTIONAL_COLOR,
} from "@/lib/prendas/types";
import type { Category } from "@/lib/prendas/types";
import { optionalUnless, withUnspecified } from "@/lib/prendas/options";
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

export function AddForm() {
  const router = useRouter();
  const t = useTranslations("form");
  const tLabel = useTranslations("labels");
  const tPhoto = useTranslations("photo");
  const tError = useTranslations("errors");
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
  // The colours currently in the form, and the ones the last photo
  // suggested. A suggestion only ever replaces an empty list or the
  // previous suggestion, never a colour the person chose.
  const [colours, setColours] = useState<string[]>([]);
  const [suggestion, setSuggestion] = useState<{
    key: number;
    colours: string[];
    offered: string[];
  }>({
    key: 0,
    colours: [],
    offered: [],
  });
  const coloursRef = useRef<string[]>([]);
  const suggestedRef = useRef<string[]>([]);

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
      fd.append("file", await shrinkForUpload(imageFile));
      try {
        const r = await fetch(`/api/garments/${newId}/image`, {
          method: "POST",
          body: fd,
        });
        if (!r.ok) throw new Error();
      } catch {
        setUploadError(tPhoto("savedWithoutPhoto"));
      }
      setIsUploading(false);
      router.replace("/armari");
    }
    run();
  }, [state, imageFile, router, tPhoto]);

  const fits = category ? FITS_BY_CATEGORY[category] : [];
  const subtypes = category ? SUBTYPES_BY_CATEGORY[category] : [];
  const sizes = category ? SIZES_BY_CATEGORY[category] : [];
  const lengths = category ? LENGTHS_BY_CATEGORY[category] : [];
  const textures = category ? TEXTURES_BY_CATEGORY[category] : [];
  const patterns = category ? PATTERNS_BY_CATEGORY[category] : [];
  const colorsRequired = !category || !CATEGORIES_WITH_OPTIONAL_COLOR.has(category);

  function changeColours(next: string[]) {
    coloursRef.current = next;
    setColours(next);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
    if (!file) return;

    const found = await suggestColours(file);
    const current = coloursRef.current;
    const untouched =
      current.length === 0 ||
      (current.length === suggestedRef.current.length &&
        current.every((c, i) => c === suggestedRef.current[i]));
    if (found.length === 0 || !untouched) return;
    // Only the dominant colour goes in. The others are offered, one tap
    // each: a photo finds a shadow, a trim or a bit of the background as
    // easily as a second colour, and every colour a piece has narrows the
    // palettes it can combine in, so a wrong one costs matches silently.
    const [dominant, ...others] = found;
    suggestedRef.current = [dominant];
    changeColours([dominant]);
    setSuggestion((s) => ({ key: s.key + 1, colours: [dominant], offered: others }));
  }

  const fromPhoto =
    suggestion.colours.length > 0 &&
    colours.length === suggestion.colours.length &&
    colours.every((c, i) => c === suggestion.colours[i]);

  return (
    <form action={formAction} className="flex flex-col gap-7">
      {imageFile && <input type="hidden" name="_hasImage" value="1" />}

      <Stack gap={3}>
        <Text variant="caption" as="span">{tPhoto("label")}</Text>
        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={tPhoto("previewAlt")} className="w-32 h-32 object-cover" />
        )}
        <div className="flex items-center gap-4">
          <TextButton
            type="button"
            tone="secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            {imageFile ? tPhoto("change") : tPhoto("add")}
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
              {tPhoto("remove")}
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

      <Field label={t("category")} required>
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
            label: tLabel(`category.${c}`),
          }))}
        />
      </Field>

      {category && subtypes.length > 0 && (
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

      {category && lengths.length > 0 && (
        <Field label={category === "SHIRT" ? t("sleeve") : t("length")} required={lengthRequired(category)}>
          <Select
            name="length"
            required={lengthRequired(category)}
            value={length}
            onChange={setLength}
            options={optionalUnless(
              lengthRequired(category),
              t("unspecified"),
              lengths.map((l) => ({ value: l, label: optionLabel(tLabel, "length", l) })),
            )}
          />
        </Field>
      )}

      <Field label={t("colors")} required={colorsRequired}>
        <ColorPickers
          key={suggestion.key}
          initialColors={suggestion.colours}
          offered={suggestion.offered}
          onChange={changeColours}
          note={fromPhoto ? t("colorsFromPhoto") : undefined}
        />
      </Field>

      {category && textures.length > 0 && (
        <Field label={t("texture")}>
          <Select
            name="texture"
            value={texture}
            onChange={setTexture}
            options={withUnspecified(t("unspecified"), textures.map((t) => ({
              value: t,
              label: tLabel(`texture.${t}`),
            })))}
          />
        </Field>
      )}

      {category && patterns.length > 0 && (
        <Field label={t("pattern")}>
          <Select
            name="pattern"
            value={pattern}
            onChange={setPattern}
            options={withUnspecified(t("unspecified"), patterns.map((p) => ({
              value: p,
              label: tLabel(`pattern.${p}`),
            })))}
          />
        </Field>
      )}

      <Field label={t("seasons")} required>
        <SeasonCheckboxes />
      </Field>

      {category && sizes.length > 0 && (
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

      {category && fits.length > 0 && (
        <Field label={t("fit")}>
          <Select
            name="fit"
            value={fit}
            onChange={setFit}
            options={withUnspecified(t("unspecified"), fits.map((f) => ({ value: f, label: optionLabel(tLabel, "fit", f) })))}
          />
        </Field>
      )}

      <Field label={t("notes")} htmlFor="notes">
        <Input id="notes" name="notes" placeholder={t("notesPlaceholder")} />
      </Field>


      {uploadError && (
        <Text variant="small" italic className="font-serif border-t border-border-strong pt-3">
          {uploadError}
        </Text>
      )}

      {state && "error" in state && (
        <Text variant="small" italic className="font-serif text-danger border-t border-danger pt-3">
          {tError(state.error)}
        </Text>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={isPending || isUploading}
        loadingText={isUploading ? tPhoto("uploadingPhoto") : t("saving")}
        className="self-start mt-2"
      >
        {t("save")}
      </Button>
    </form>
  );
}
