import { NextRequest, NextResponse } from "next/server";
import { getUploadMaxMb } from "@/lib/uploads";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** What multipart framing adds around the file itself. */
const FORM_OVERHEAD_BYTES = 64 * 1024;

const reject = (error: string, status: number) => NextResponse.json({ error }, { status });

/**
 * Reads the `file` field of an image upload, or the response to send.
 *
 * `Content-Length` is checked before the body is read: `formData()` buffers
 * everything, and the pod has 512 MiB, so a request over the limit must be
 * refused before it is held in memory and not after. The declared type is
 * only a first filter; that the bytes really are an image is decided by
 * `sharp` in `saveUploadImage`.
 */
export async function readImageUpload(
  request: NextRequest,
): Promise<{ buffer: Buffer } | { response: NextResponse }> {
  const maxBytes = getUploadMaxMb() * 1024 * 1024;
  const declared = Number(request.headers.get("content-length"));
  if (declared > maxBytes + FORM_OVERHEAD_BYTES) {
    return { response: reject(`File exceeds ${getUploadMaxMb()} MB limit`, 413) };
  }

  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) return { response: reject("No file provided", 400) };
  if (!ALLOWED_TYPES.has(file.type)) {
    return { response: reject("Only JPEG, PNG and WebP are accepted", 415) };
  }
  if (file.size > maxBytes) {
    return { response: reject(`File exceeds ${getUploadMaxMb()} MB limit`, 413) };
  }
  return { buffer: Buffer.from(await file.arrayBuffer()) };
}

/** `saveUploadImage` threw: the bytes were not a decodable image (or too many pixels). */
export const notAnImage = () => reject("The file is not a valid image", 422);
