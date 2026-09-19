/**
 * Client of the background removal sidecar (`sidecars/rembg`), reached
 * only from inside the cluster. Best effort by design: no URL configured,
 * a slow or failing sidecar, or an image it cannot read all mean "no
 * cut-out", and the garment keeps its photograph as it always did.
 */

/** A request longer than this is not worth a person standing at the
 * upload screen for: the photo is kept as it is. */
const TIMEOUT_MS = 30_000;

export function backgroundRemovalUrl(): string | null {
  const url = process.env.BG_REMOVAL_URL?.trim();
  return url ? url.replace(/\/+$/, "") : null;
}

/** PNG bytes of the image with its background made transparent, or null. */
export async function removeBackground(image: Buffer): Promise<Buffer | null> {
  const base = backgroundRemovalUrl();
  if (!base) return null;
  try {
    const body = new FormData();
    body.append("file", new Blob([new Uint8Array(image)], { type: "image/png" }), "photo.png");
    const res = await fetch(`${base}/remove`, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}
