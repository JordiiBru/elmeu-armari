"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function ImportForm() {
  const inputRef = useRef<HTMLInputElement>(null);
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
      const data = await res.json() as { imported?: number; error?: string };

      if (!res.ok) {
        setStatus({ type: "error", msg: data.error ?? "Error desconegut" });
      } else {
        setStatus({ type: "ok", msg: `${data.imported} peces importades correctament.` });
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
      }
    } catch {
      setStatus({ type: "error", msg: "Fitxer invàlid o error de xarxa." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            value="merge"
            checked={mode === "merge"}
            onChange={() => setMode("merge")}
          />
          Merge <span className="text-gray-400">(afegeix sense esborrar les existents)</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            value="replace"
            checked={mode === "replace"}
            onChange={() => setMode("replace")}
          />
          Replace <span className="text-gray-400">(esborra tot i reimporta)</span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          required
          className="text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? "Important..." : "Importar"}
        </button>
      </div>

      {status && (
        <p className={`text-sm ${status.type === "ok" ? "text-green-700" : "text-red-600"}`}>
          {status.msg}
        </p>
      )}
    </form>
  );
}
