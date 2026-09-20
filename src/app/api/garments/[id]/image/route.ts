import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/api";
import { requireSameOrigin } from "@/lib/auth/same-origin";
import { findGarmentById, setGarmentImage } from "@/lib/prendas/service";
import { saveUploadImage, deleteUploadImage } from "@/lib/uploads";
import { readImageUpload, notAnImage } from "@/lib/upload-request";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const crossOrigin = requireSameOrigin(request);
  if (crossOrigin) return crossOrigin;

  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { userId } = auth;

  const { id } = await params;

  const garment = await findGarmentById(userId, id);
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

  await setGarmentImage(userId, id, filename);

  revalidatePath("/armari");

  return NextResponse.json({ image: filename });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const crossOrigin = requireSameOrigin(_request);
  if (crossOrigin) return crossOrigin;

  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { userId } = auth;

  const { id } = await params;

  const garment = await findGarmentById(userId, id);
  if (!garment) {
    return NextResponse.json({ error: "Garment not found" }, { status: 404 });
  }

  await deleteUploadImage(id);
  await setGarmentImage(userId, id, null);

  revalidatePath("/armari");

  return NextResponse.json({ ok: true });
}
