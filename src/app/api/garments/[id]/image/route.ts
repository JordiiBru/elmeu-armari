import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/api";
import { findGarmentById, setGarmentImage } from "@/lib/prendas/service";
import { saveUploadImage, deleteUploadImage } from "@/lib/uploads";
import { readImageUpload, notAnImage } from "@/lib/upload-request";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireSession();
  if (denied) return denied;

  const { id } = await params;

  const garment = await findGarmentById(id);
  if (!garment) {
    return NextResponse.json({ error: "Garment not found" }, { status: 404 });
  }

  const upload = await readImageUpload(request);
  if ("response" in upload) return upload.response;

  let filename: string;
  try {
    filename = await saveUploadImage(upload.buffer, id);
  } catch {
    return notAnImage();
  }

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

  await deleteUploadImage(id);
  await setGarmentImage(id, null);

  revalidatePath("/armari");

  return NextResponse.json({ ok: true });
}
