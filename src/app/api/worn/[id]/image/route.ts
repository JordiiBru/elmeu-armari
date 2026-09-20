import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/api";
import { requireSameOrigin } from "@/lib/auth/same-origin";
import { findDayById, setDayPhoto } from "@/lib/outfits/service";
import { saveUploadImage, deleteUploadImage } from "@/lib/uploads";
import { readImageUpload, notAnImage } from "@/lib/upload-request";

/**
 * The photo of you wearing the day, mirrored from
 * `/api/garments/[id]/image`: same guards, same pipeline, keyed by the
 * worn event instead of the garment. A day only has a photo once it has
 * an outfit, which is what makes the event id the natural key.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const crossOrigin = requireSameOrigin(request);
  if (crossOrigin) return crossOrigin;

  const denied = await requireSession();
  if (denied) return denied;

  const { id } = await params;

  const day = await findDayById(id);
  if (!day) {
    return NextResponse.json({ error: "Day not found" }, { status: 404 });
  }

  const upload = await readImageUpload(request);
  if ("response" in upload) return upload.response;

  let filename: string;
  try {
    filename = await saveUploadImage(upload.buffer, id);
  } catch {
    return notAnImage();
  }

  await setDayPhoto(id, filename);

  revalidatePath("/avui");

  return NextResponse.json({ image: filename });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const crossOrigin = requireSameOrigin(_request);
  if (crossOrigin) return crossOrigin;

  const denied = await requireSession();
  if (denied) return denied;

  const { id } = await params;

  const day = await findDayById(id);
  if (!day) {
    return NextResponse.json({ error: "Day not found" }, { status: 404 });
  }

  await deleteUploadImage(id);
  await setDayPhoto(id, null);

  revalidatePath("/avui");

  return NextResponse.json({ ok: true });
}
