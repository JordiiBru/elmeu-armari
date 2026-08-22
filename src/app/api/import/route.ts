import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { addGarment, findAllGarments, deleteGarment } from "@/lib/prendas/service";
import {
  CATEGORIES,
  SEASONS,
  FITS_BY_CATEGORY,
  SUBTYPES_BY_CATEGORY,
  LENGTHS_BY_CATEGORY,
  TEXTURES_BY_CATEGORY,
  PATTERNS_BY_CATEGORY,
  SIZES_BY_CATEGORY,
  CATEGORIES_WITH_OPTIONAL_COLOR,
} from "@/lib/prendas/types";
import { isHex } from "@/lib/prendas/validation";
import type { Category, Texture, Pattern, Season } from "@/lib/prendas/types";

interface GarmentImport extends Record<string, unknown> {
  category: Category;
  texture: Texture | null;
  pattern: Pattern | null;
  seasons: Season[];
  size: string | null;
  fit: string | null;
  subtype?: string | null;
  length?: string | null;
  notes?: string | null;
  colors: string[];
}

interface ImportPayload {
  version: number;
  garments: GarmentImport[];
}

function validate(body: unknown): { ok: true; payload: ImportPayload } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) return { ok: false, error: "Format invàlid" };
  const b = body as Record<string, unknown>;
  if (b.version !== 3) return { ok: false, error: "Versió no suportada (cal versió 3)" };
  if (!Array.isArray(b.garments)) return { ok: false, error: "Camp 'garments' obligatori" };

  for (const [i, g] of (b.garments as unknown[]).entries()) {
    if (typeof g !== "object" || g === null) return { ok: false, error: `Peça ${i}: format invàlid` };
    const gr = g as Record<string, unknown>;
    const category = gr.category as Category;
    if (!CATEGORIES.includes(category)) return { ok: false, error: `Peça ${i}: category invàlida` };

    const validTextures = TEXTURES_BY_CATEGORY[category];
    const texture = gr.texture as string | null | undefined;
    if (texture ? !validTextures.includes(texture as Texture) : validTextures.length > 0)
      return { ok: false, error: `Peça ${i}: texture invàlida per categoria ${category}` };

    const validPatterns = PATTERNS_BY_CATEGORY[category];
    const pattern = gr.pattern as string | null | undefined;
    if (pattern ? !validPatterns.includes(pattern as Pattern) : validPatterns.length > 0)
      return { ok: false, error: `Peça ${i}: pattern invàlid per categoria ${category}` };

    const validFits = FITS_BY_CATEGORY[category];
    const fit = gr.fit as string | null | undefined;
    if (fit ? !validFits.includes(fit) : validFits.length > 0)
      return { ok: false, error: `Peça ${i}: fit invàlid per categoria ${category}` };

    if (!Array.isArray(gr.seasons) || gr.seasons.some((s) => !SEASONS.includes(s as Season)))
      return { ok: false, error: `Peça ${i}: seasons invàlides` };

    const validSizes = SIZES_BY_CATEGORY[category];
    const size = gr.size as string | null | undefined;
    if (size ? !validSizes.includes(size) : validSizes.length > 0)
      return { ok: false, error: `Peça ${i}: size invàlid per categoria ${category}` };

    const colorsRequired = !CATEGORIES_WITH_OPTIONAL_COLOR.has(category);
    if (!Array.isArray(gr.colors) || (colorsRequired && gr.colors.length === 0) || gr.colors.some((c) => !isHex(c)))
      return { ok: false, error: `Peça ${i}: colors invàlids (cal array de hex #rrggbb)` };

    const validSubtypes = SUBTYPES_BY_CATEGORY[category];
    const subtype = gr.subtype as string | null | undefined;
    if (validSubtypes.length > 0 && subtype && !validSubtypes.includes(subtype))
      return { ok: false, error: `Peça ${i}: subtype invàlid per categoria ${category}` };
    const validLengths = LENGTHS_BY_CATEGORY[category];
    const length = gr.length as string | null | undefined;
    if (length && (validLengths.length === 0 || !validLengths.includes(length)))
      return { ok: false, error: `Peça ${i}: length invàlida per categoria ${category}` };
  }

  return { ok: true, payload: b as unknown as ImportPayload };
}

/**
 * Two ways in. A signed-in session is the app's own /settings screen
 * importing a file the owner just picked; `IMPORT_SECRET` is for a
 * script with no browser, restoring a backup over curl. Before there
 * were accounts the secret was the only lock on a destructive endpoint,
 * which is why an unconfigured production deploy still refuses the
 * token path rather than falling open.
 */
async function checkAuth(req: NextRequest): Promise<NextResponse | null> {
  const session = await auth();
  if (session?.user && !session.user.mustChangePw) return null;

  const importSecret = process.env.IMPORT_SECRET;

  if (!importSecret) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "IMPORT_SECRET env var not set. Configure it to enable import." },
        { status: 503 }
      );
    }
    return null; // dev: open
  }

  const header = req.headers.get("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (token !== importSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  const authError = await checkAuth(req);
  if (authError) return authError;

  const mode = req.nextUrl.searchParams.get("mode") ?? "merge";

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invàlid" }, { status: 400 });
  }

  const result = validate(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });

  const garments = result.payload.garments;

  if (mode === "replace") {
    // Delete + insert in one logical operation. Sequential inserts avoid
    // lock contention on the single-writer SQLite adapter.
    const existing = await findAllGarments();
    for (const g of existing) {
      await deleteGarment(g.id);
    }
  }

  let imported = 0;
  for (const g of garments) {
    await addGarment({
      category: g.category,
      texture: g.texture,
      pattern: g.pattern,
      seasons: g.seasons,
      size: g.size,
      subtype: g.subtype ?? null,
      length: g.length ?? null,
      fit: g.fit,
      notes: g.notes ?? undefined,
      // Dedupe like validateGarmentForm does — the Color [garmentId, hex]
      // unique constraint would abort the import on a duplicate otherwise.
      hexColors: [...new Set(g.colors.map((c) => c.toLowerCase()))],
    });
    imported++;
  }

  revalidatePath("/armari");
  revalidatePath("/stats");
  revalidatePath("/settings");

  return NextResponse.json({ imported });
}
