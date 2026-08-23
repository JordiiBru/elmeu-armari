/** Longest edge the browser sends. The server re-encodes to 800px, so
 * anything above this is bytes uploaded to be thrown away — and on a
 * phone those bytes are the whole wait. */
const MAX_EDGE = 1600;

/**
 * Shrinks a photo in the browser before it is uploaded.
 *
 * A picture straight out of an iPhone is three or four megabytes, which
 * over a home upstream link is several seconds of standing there holding
 * the phone. Measured against the dev server: 6.1s for one upload, of
 * which 150ms was the server. Resampled here it is a few hundred
 * kilobytes and the wait goes with it.
 *
 * `imageOrientation: "from-image"` is the part that must not be skipped:
 * a canvas drops EXIF, so without it every portrait taken sideways would
 * be stored sideways — the server's `sharp().rotate()` would have no
 * orientation tag left to act on. Anything the browser cannot do, at any
 * step, returns the original file: a slow upload is a worse photo than
 * no photo, but a failed one is worse than both.
 */
export async function shrinkForUpload(file: File): Promise<File> {
  if (typeof createImageBitmap !== "function") return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    // WebP keeps the alpha channel a background-removed cut-out arrives
    // with. A browser that cannot encode it hands back a PNG, which the
    // upload route accepts just the same.
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.9),
    );
    if (!blob || blob.size >= file.size) return file;
    const extension = blob.type === "image/png" ? "png" : "webp";
    return new File([blob], `photo.${extension}`, { type: blob.type });
  } catch {
    return file;
  }
}
