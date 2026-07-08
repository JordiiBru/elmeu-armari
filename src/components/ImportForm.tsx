"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, TextButton } from "@/components/ui";

export function ImportForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [status, setStatus] = useState<{ type: "ok" | "error"; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus(null);

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
        setStatus({ type: "error", msg: data.error ?? "Error desconegut" });
      } else {
        setStatus({
          type: "ok",
          msg: `${data.imported} peces importades correctament.`,
        });
        if (inputRef.current) inputRef.current.value = "";
        setFileName(null);
        router.refresh();
      }
    } catch {
      setStatus({ type: "error", msg: "Fitxer invàlid o error de xarxa." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <span className="type-caption">
          mode
        </span>
        <div className="flex flex-col gap-2">
          <ModeOption
            checked={mode === "merge"}
            onSelect={() => setMode("merge")}
            title="fusionar"
            description="afegeix les peces sense esborrar les existents."
          />
          <ModeOption
            checked={mode === "replace"}
            onSelect={() => setMode("replace")}
            title="reemplaçar"
            description="esborra tot l'arxiu i el reimporta des de zero."
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="type-caption">
          fitxer
        </span>
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
      </div>

      {status && (
        <p className="font-serif italic text-sm text-foreground border-t border-foreground pt-3">
          {status.msg}
        </p>
      )}
    </form>
  );
}

function ModeOption({
  checked,
  onSelect,
  title,
  description,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex items-start gap-3 text-left active:scale-[0.99] transition-transform"
      aria-pressed={checked}
    >
      <span
        aria-hidden
        className={`mt-1.5 h-2.5 w-2.5 rounded-full border transition-colors ${
          checked
            ? "bg-foreground border-foreground"
            : "bg-transparent border-border"
        }`}
      />
      <span className="flex flex-col gap-0.5">
        <span
          className={`font-serif text-base ${
            checked ? "text-foreground" : "text-foreground-secondary"
          }`}
        >
          {title}
        </span>
        <span className="font-serif italic text-sm text-foreground-secondary">
          {description}
        </span>
      </span>
    </button>
  );
}
