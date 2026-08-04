"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { GarmentWithColors } from "@/lib/prendas/types";
import { UI } from "@/lib/prendas/ui-strings";
import { markDirtyAction, markCleanAction } from "@/app/bugaderia/actions";
import { PieceThumb } from "./PieceThumb";
import { Button, TextButton, Icon, EmptyState, useToast } from "@/components/ui";

type Mode = "soil" | "wash";

const COPY = {
  soil: UI.bugaderia.picker.soil,
  wash: UI.bugaderia.picker.wash,
};

function GarmentPickCard({
  garment,
  selected,
  onToggle,
}: {
  garment: GarmentWithColors;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={`group relative flex flex-col gap-2 text-left transition-opacity duration-[var(--duration-base)] ease-[var(--ease-standard)] ${
        selected ? "opacity-100" : "opacity-70 hover:opacity-100"
      }`}
    >
      <div
        className={`relative aspect-[3/4] w-full overflow-hidden border transition-colors duration-[var(--duration-base)] ease-[var(--ease-standard)] ${
          selected ? "border-text-primary border-2" : "border-border"
        }`}
      >
        <PieceThumb garment={garment} thumb className="h-full w-full" />
        {selected && (
          <span className="absolute top-1.5 right-1.5 inline-flex bg-text-primary p-1 text-text-inverse">
            <Icon name="check" size={12} />
          </span>
        )}
      </div>
    </button>
  );
}

export function LaundryPicker({
  mode,
  garments,
}: {
  mode: Mode;
  garments: GarmentWithColors[];
}) {
  const copy = COPY[mode];
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const toggle = (id: string) => {
    navigator.vibrate?.(10);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(garments.map((g) => g.id)));
  const clearSelection = () => setSelected(new Set());

  const handleSubmit = () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    startTransition(async () => {
      const action = mode === "soil" ? markDirtyAction : markCleanAction;
      const { affected } = await action(ids);
      toast.show(copy.toast(affected), "success");
      router.push("/bugaderia");
    });
  };

  if (garments.length === 0) {
    return <EmptyState title={copy.empty} />;
  }

  return (
    <div className="flex flex-col gap-6 pb-28">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {garments.map((garment) => (
          <GarmentPickCard
            key={garment.id}
            garment={garment}
            selected={selected.has(garment.id)}
            onToggle={() => toggle(garment.id)}
          />
        ))}
      </div>

      {mode === "wash" && (
        <TextButton type="button" tone="secondary" onClick={selectAll} className="self-start">
          {UI.bugaderia.picker.wash.didLaundry}
        </TextButton>
      )}

      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-4 border-t border-border bg-background px-6 py-4">
          <div className="flex items-center gap-4">
            <span className="type-caption tabular-nums">
              {UI.bugaderia.picker.selectedCount(selected.size)}
            </span>
            <TextButton type="button" tone="secondary" onClick={clearSelection} disabled={pending}>
              {UI.bugaderia.picker.clearSelection}
            </TextButton>
          </div>
          <Button
            type="button"
            size="lg"
            onClick={handleSubmit}
            loading={pending}
            loadingText={copy.submitting}
          >
            {copy.submit}
          </Button>
        </div>
      )}
    </div>
  );
}
