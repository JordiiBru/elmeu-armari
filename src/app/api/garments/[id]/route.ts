import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/api";
import { requireSameOrigin } from "@/lib/auth/same-origin";
import { deleteGarment, findGarmentById } from "@/lib/prendas/service";
import { deleteUploadImage } from "@/lib/uploads";

/**
 * A plain route handler rather than a Server Action: deleting is always
 * called from `/armari/[slug]` (or its intercepted twin), the very route
 * that 404s the moment the garment it names is gone. A Server Action
 * invoked from that page triggers Next's own automatic refresh of the
 * segment that called it once the action resolves — which hits that
 * 404 and races the client-side redirect meant to leave it, and reliably
 * loses that race in a production build (reproduced: lands back on the
 * dead URL, or — from the intercepted route specifically — on the root
 * not-found boundary). A route handler carries no such refresh; the
 * caller decides when and where to navigate after the fetch resolves.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const crossOrigin = requireSameOrigin(request);
  if (crossOrigin) return crossOrigin;

  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { userId } = auth;

  const { id } = await params;

  // Ownership first: the photo on disk is named after the garment, so it
  // must not be unlinked for an id that is not in this wardrobe.
  if (!(await findGarmentById(userId, id))) {
    return NextResponse.json({ error: "Garment not found" }, { status: 404 });
  }

  await deleteGarment(userId, id);
  await deleteUploadImage(id);

  revalidatePath("/armari");
  revalidatePath("/stats");
  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath("/avui");

  return NextResponse.json({ ok: true });
}
