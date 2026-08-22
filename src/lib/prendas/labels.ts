import type { useTranslations } from "next-intl";

/** A translator scoped to the `labels` namespace, from either
 * `useTranslations("labels")` or `getTranslations("labels")`. */
export type LabelsTranslator = ReturnType<typeof useTranslations<"labels">>;

type LabelKey = Parameters<LabelsTranslator>[0];

/**
 * Fit, subtype and length are free strings in the data model — a garment
 * carries whatever was valid for its category when it was written, and an
 * imported archive can carry a value this build no longer offers. `t`
 * renders an error for a key it does not have, where the old lookup
 * table simply returned `undefined`, so ask first and fall back to the
 * raw value.
 *
 * Category, texture, pattern and season are real unions and index the
 * namespace directly: `t(`category.${garment.category}`)`.
 */
export function optionLabel(
  t: LabelsTranslator,
  group: "fit" | "subtype" | "length",
  value: string,
): string {
  const key = `${group}.${value}` as LabelKey;
  return t.has(key) ? t(key) : value;
}
