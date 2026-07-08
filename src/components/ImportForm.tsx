"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
        toast.show(data.error ?? "Error desconegut", "danger");
      } else {
        toast.show(
          `${data.imported} peces importades correctament.`,
          "success",
        );
        if (inputRef.current) inputRef.current.value = "";
        setFileName(null);
        router.refresh();
      }
    } catch {
      toast.show("Fitxer invàlid o error de xarxa.", "danger");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Field
        label="mode"
        hint={
          mode === "merge"
            ? "afegeix les peces sense esborrar les existents."
            : "esborra tot l'arxiu i el reimporta des de zero."
        }
      >
        <SegmentedControl
          value={mode}
          onChange={setMode}
          ariaLabel="Mode d'importació"
          options={[
            { value: "merge", label: "fusionar" },
            { value: "replace", label: "reemplaçar" },
          ]}
        />
      </Field>

      <Stack gap={3}>
        <Text variant="caption" as="span">fitxer</Text>
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
            {fileName ?? "seleccionar fitxer"}
          </TextButton>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!fileName}
            loading={loading}
            loadingText="important…"
          >
            importar
          </Button>
        </div>
      </Stack>
    </form>
  );
}
