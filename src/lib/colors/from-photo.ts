import { extractColours } from "./extract";

/** Analysis only: small enough to be instant on a phone, big enough for
 * the k-means to see the garment. The uploaded file is never this one. */
const ANALYSIS_EDGE = 64;

/**
 * The dominant colours of a photo the person just picked, decoded in the
 * browser. Anything the browser cannot do returns no suggestion: the
 * colours are then chosen by hand, exactly as without a photo.
 */
export async function suggestColours(file: File): Promise<string[]> {
  if (typeof createImageBitmap !== "function") return [];
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, ANALYSIS_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      bitmap.close();
      return [];
    }
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return extractColours({ data, width, height });
  } catch {
    return [];
  }
}
