import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { addGarment, findAllGarments, deleteGarment } from "@/lib/prendas/service";
import { CATEGORIES, TEXTURES, PATTERNS, SEASONS, FITS_BY_CATEGORY, SUBTYPES_BY_CATEGORY, LENGTHS_BY_CATEGORY } from "@/lib/prendas/types";
import { isHex } from "@/lib/prendas/validation";
import type { Category, Texture, Pattern, Season } from "@/lib/prendas/types";

interface GarmentImport extends Record<string, unknown> {
  category: Category;
  texture: Texture;
  pattern: Pattern;
  seasons: Season[];
  size: string;
  fit: string;
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
    if (!TEXTURES.includes(gr.texture as Texture)) return { ok: false, error: `Peça ${i}: texture invàlida` };
    if (!PATTERNS.includes(gr.pattern as Pattern)) return { ok: false, error: `Peça ${i}: pattern invàlid` };
    if (!FITS_BY_CATEGORY[category]?.includes(gr.fit as string)) return { ok: false, error: `Peça ${i}: fit invàlid per categoria ${category}` };
    if (!Array.isArray(gr.seasons) || gr.seasons.some((s) => !SEASONS.includes(s as Season)))
      return { ok: false, error: `Peça ${i}: seasons invàlides` };
    if (typeof gr.size !== "string" || gr.size.trim() === "") return { ok: false, error: `Peça ${i}: size buit` };
    if (!Array.isArray(gr.colors) || gr.colors.length === 0 || gr.colors.some((c) => !isHex(c)))
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

function checkAuth(req: NextRequest): NextResponse | null {
  const importSecret = process.env.IMPORT_SECRET;

  // In production, IMPORT_SECRET is required. An unconfigured prod deploy
  // would otherwise expose a destructive endpoint to anyone on the network.
  if (!importSecret) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "IMPORT_SECRET env var not set. Configure it to enable import." },
        { status: 503 }
      );
    }
    return null; // dev: open
  }

  const auth = req.headers.get("Authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (token !== importSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  const authError = checkAuth(req);
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
