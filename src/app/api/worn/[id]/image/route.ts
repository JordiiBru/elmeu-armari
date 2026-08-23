import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/api";
import { findDayById, setDayPhoto } from "@/lib/outfits/service";
import { saveUploadImage, deleteUploadImage, getUploadMaxMb } from "@/lib/uploads";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

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
  const denied = await requireSession();
  if (denied) return denied;

  const { id } = await params;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG and WebP are accepted" },
      { status: 415 }
    );
  }

  const maxBytes = getUploadMaxMb() * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File exceeds ${getUploadMaxMb()} MB limit` },
      { status: 413 }
    );
  }

  const day = await findDayById(id);
  if (!day) {
    return NextResponse.json({ error: "Day not found" }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = await saveUploadImage(buffer, id);

  await setDayPhoto(id, filename);

  revalidatePath("/avui");

  return NextResponse.json({ image: filename });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
