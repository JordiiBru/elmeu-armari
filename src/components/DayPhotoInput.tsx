"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { postWithProgress, shrinkForUpload } from "@/lib/image-client";
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
  // Where the work is, so the wait says what it is waiting for: the photo
  // is shrunk on the device (a 12 MP iPhone picture takes a moment), then
  // sent (the part that depends on the connection), then processed by the
  // server, which is the part nobody can see.
  const [status, setStatus] = useState<
    "idle" | "preparing" | "sending" | "saving" | "removing" | "error"
  >("idle");
  const [percent, setPercent] = useState(0);
  // The picture that was just chosen, shown in the box straight away: the
  // first proof that the tap did something.
  const [preview, setPreview] = useState<string | null>(null);
  const busy = status !== "idle" && status !== "error" ? true : Boolean(disabled);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPercent(0);
    setPreview(URL.createObjectURL(file));
    setStatus("preparing");
    const body = new FormData();
    body.append("file", await shrinkForUpload(file));
    setStatus("sending");
    const ok = await postWithProgress(`/api/worn/${eventId}/image`, body, {
      onProgress: (fraction) => setPercent(Math.round(fraction * 100)),
      onSent: () => setStatus("saving"),
    });
    if (input.current) input.current.value = "";
    setPreview(null);
    if (!ok) {
      setStatus("error");
      return;
    }
    setStatus("idle");
    router.refresh();
  }

  async function remove() {
    setStatus("removing");
    const r = await fetch(`/api/worn/${eventId}/image`, { method: "DELETE" });
    setStatus(r.ok ? "idle" : "error");
    if (r.ok) router.refresh();
  }

  const stateLabel =
    status === "preparing"
      ? t("preparing")
      : status === "sending"
        ? t("sending", { percent })
        : status === "saving"
          ? t("saving")
          : status === "removing"
            ? t("removing")
            : null;

  return (
    <Stack gap={2}>
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className={`${BOX} relative flex-1 hover:border-text-primary hover:text-text-primary ${
            hasPhoto ? "border-border" : "border-dashed border-border"
          }`}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-9 w-9 object-cover opacity-70" />
          ) : (
            <Icon name="camera" size={20} />
          )}
          <span className="font-serif italic type-small lowercase">
            {stateLabel ?? (hasPhoto ? t("change") : t("add"))}
          </span>
          {/* A hairline that fills as the bytes leave the phone, then pulses
              while the server works on them. Flat, like everything else. */}
          {(status === "sending" || status === "saving" || status === "preparing") && (
            <span
              aria-hidden
              className={`absolute inset-x-0 bottom-0 h-px bg-text-primary transition-[width] duration-[var(--duration-base)] ease-[var(--ease-standard)] ${
                status === "sending" ? "" : "animate-pulse"
              }`}
              style={{ width: status === "sending" ? `${percent}%` : "100%" }}
            />
          )}
        </button>
        {hasPhoto && withRemove && (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            aria-label={t("remove")}
            title={t("remove")}
            className={`${BOX} w-14 border-border text-danger hover:border-danger`}
          >
            <Icon name="close" size={16} />
          </button>
        )}
      </div>
      {/* Said aloud too: the label inside the button changes, but a screen
          reader is only told when it lives in a live region. */}
      <span role="status" aria-live="polite" className="sr-only">
        {stateLabel}
      </span>
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
