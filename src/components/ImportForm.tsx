"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Button,
  TextButton,
  Field,
  Text,
  Stack,
  SegmentedControl,
  useToast,
} from "@/components/ui";

export function ImportForm() {
  const t = useTranslations("settings.import");
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      const text = await file.text();
      const body = JSON.parse(text);
      const res = await fetch(`/api/import?mode=${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { imported?: number; error?: string };

      if (!res.ok) {
        toast.show(data.error ?? t("unknownError"), "danger");
      } else {
        toast.show(t("success", { count: data.imported ?? 0 }), "success");
        if (inputRef.current) inputRef.current.value = "";
        setFileName(null);
        router.refresh();
      }
    } catch {
      toast.show(t("networkError"), "danger");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Field
        label={t("modeLabel")}
        hint={mode === "merge" ? t("mergeHint") : t("replaceHint")}
      >
        <SegmentedControl
          value={mode}
          onChange={setMode}
          ariaLabel={t("modeAriaLabel")}
          options={[
            { value: "merge", label: t("merge") },
            { value: "replace", label: t("replace") },
          ]}
        />
      </Field>

      <Stack gap={3}>
        <Text variant="caption" as="span">{t("fileLabel")}</Text>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          required
          className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
        <div className="flex items-center gap-6">
          <TextButton type="button" onClick={() => inputRef.current?.click()}>
            {fileName ?? t("chooseFile")}
          </TextButton>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!fileName}
            loading={loading}
            loadingText={t("submitting")}
          >
            {t("submit")}
          </Button>
        </div>
      </Stack>
    </form>
  );
}
