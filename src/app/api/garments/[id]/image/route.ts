import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/api";
import { findGarmentById, setGarmentImage } from "@/lib/prendas/service";
import { saveGarmentImage, deleteGarmentImage, getUploadMaxMb } from "@/lib/uploads";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

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

  const garment = await findGarmentById(id);
  if (!garment) {
    return NextResponse.json({ error: "Garment not found" }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = await saveGarmentImage(buffer, id);

  await setGarmentImage(id, filename);

  revalidatePath("/armari");

  return NextResponse.json({ image: filename });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireSession();
  if (denied) return denied;

  const { id } = await params;

  const garment = await findGarmentById(id);
  if (!garment) {
    return NextResponse.json({ error: "Garment not found" }, { status: 404 });
  }

  await deleteGarmentImage(id);
  await setGarmentImage(id, null);

  revalidatePath("/armari");

  return NextResponse.json({ ok: true });
}
