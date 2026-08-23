"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icon, Stack, Text, TextButton } from "@/components/ui";

type Variant = "strip" | "quiet";

interface Props {
  /** The day the photo belongs to — a worn event id. */
  eventId: string;
  hasPhoto: boolean;
  /** `strip`: the wide slot under the week. `quiet`: an italic action. */
  variant?: Variant;
  /** Offer "treure foto" beside the trigger when there is one to remove. */
  withRemove?: boolean;
  disabled?: boolean;
}

/**
 * Adding, replacing and removing the photo of a day.
 *
 * No `capture` attribute on the input: forcing the camera would be right
 * for a snapshot, and wrong here — the picture is a mirror selfie that
 * has already been through a background remover, so it comes from the
 * gallery. `accept` alone still offers the camera on a phone.
 */
export function DayPhotoInput({
  eventId,
  hasPhoto,
  variant = "quiet",
  withRemove = false,
  disabled,
}: Props) {
  const t = useTranslations("dayPhoto");
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "busy" | "error">("idle");
  const busy = status === "busy" || disabled;

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("busy");
    const body = new FormData();
    body.append("file", file);
    const r = await fetch(`/api/worn/${eventId}/image`, { method: "POST", body });
    if (input.current) input.current.value = "";
    if (!r.ok) {
      setStatus("error");
      return;
    }
    setStatus("idle");
    router.refresh();
  }

  async function remove() {
    setStatus("busy");
    const r = await fetch(`/api/worn/${eventId}/image`, { method: "DELETE" });
    setStatus(r.ok ? "idle" : "error");
    if (r.ok) router.refresh();
  }

  const label = status === "busy" ? t("uploading") : hasPhoto ? t("change") : t("add");

  const file = (
    <input
      ref={input}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="hidden"
      onChange={upload}
    />
  );

  const error = status === "error" && (
    <Text variant="small" italic tone="secondary" className="font-serif">
      {t("failed")}
    </Text>
  );

  // A wide, empty frame rather than a button: it stands where the photo
  // will stand, which says what it is for without a sentence explaining
  // it. Same dashed hairline the wardrobe uses for "add a piece".
  if (variant === "strip") {
    return (
      <Stack gap={2}>
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="flex h-14 w-full items-center justify-center gap-3 border border-dashed border-border text-text-secondary outline-none transition-colors duration-[var(--duration-base)] ease-[var(--ease-standard)] hover:border-text-primary hover:text-text-primary disabled:opacity-40 focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Icon name="camera" size={20} />
          <span className="font-serif italic type-small lowercase">{label}</span>
        </button>
        {error}
        {file}
      </Stack>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <TextButton type="button" tone="secondary" disabled={busy} onClick={() => input.current?.click()}>
        <Icon name="camera" size={14} />
        {label}
      </TextButton>
      {hasPhoto && withRemove && status !== "busy" && (
        <TextButton type="button" tone="danger" onClick={remove}>
          {t("remove")}
        </TextButton>
      )}
      {error}
      {file}
    </div>
  );
}
