"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { shrinkForUpload } from "@/lib/image-client";
import { Icon, Stack, Text } from "@/components/ui";

interface Props {
  /** The day the photo belongs to — a worn event id. */
  eventId: string;
  hasPhoto: boolean;
  /** Offer removal beside the trigger when there is a photo to remove. */
  withRemove?: boolean;
  disabled?: boolean;
}

const BOX =
  "flex h-14 items-center justify-center gap-3 border text-text-secondary outline-none " +
  "transition-colors duration-[var(--duration-base)] ease-[var(--ease-standard)] " +
  "disabled:opacity-40 focus-visible:ring-1 focus-visible:ring-focus-ring " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-elevated";

/**
 * Adding, replacing and removing the photograph of a day.
 *
 * A box rather than the app's usual italic link: this is the one thing on
 * the day that is still optional, and an empty frame standing where the
 * photograph will stand says what it is for without a sentence explaining
 * it. Dashed while there is nothing in it, the same way the wardrobe
 * marks the slot for a piece it does not have yet.
 *
 * No `capture` attribute on the input: forcing the camera would be right
 * for a snapshot and is wrong here, because the picture is a mirror selfie
 * that has already been through a background remover and comes from the
 * gallery. `accept` alone still offers the camera on a phone.
 */
export function DayPhotoInput({ eventId, hasPhoto, withRemove = false, disabled }: Props) {
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
    body.append("file", await shrinkForUpload(file));
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

  return (
    <Stack gap={2}>
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className={`${BOX} flex-1 hover:border-text-primary hover:text-text-primary ${
            hasPhoto ? "border-border" : "border-dashed border-border"
          }`}
        >
          <Icon name="camera" size={20} />
          <span className="font-serif italic type-small lowercase">
            {status === "busy" ? t("uploading") : hasPhoto ? t("change") : t("add")}
          </span>
        </button>
        {hasPhoto && withRemove && (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            aria-label={t("remove")}
            title={t("remove")}
            className={`${BOX} w-14 border-border hover:border-danger hover:text-danger`}
          >
            <Icon name="close" size={16} />
          </button>
        )}
      </div>
      {status === "error" && (
        <Text variant="small" italic tone="secondary" className="font-serif">
          {t("failed")}
        </Text>
      )}
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={upload}
      />
    </Stack>
  );
}
