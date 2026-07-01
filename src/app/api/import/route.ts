import { NextRequest, NextResponse } from "next/server";
import { addGarment, findAllGarments, deleteGarment } from "@/lib/prendas/service";
import { CATEGORIES, TEXTURES, PATTERNS, FITS, SEASONS } from "@/lib/prendas/types";
import { isHex } from "@/lib/prendas/validation";
import type { Category, Texture, Pattern, Fit, Season } from "@/lib/prendas/types";

interface GarmentImport {
  category: Category;
  texture: Texture;
  pattern: Pattern;
  seasons: Season[];
  size: string;
  fit: Fit;
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
    if (!CATEGORIES.includes(gr.category as Category)) return { ok: false, error: `Peça ${i}: category invàlida` };
    if (!TEXTURES.includes(gr.texture as Texture)) return { ok: false, error: `Peça ${i}: texture invàlida` };
    if (!PATTERNS.includes(gr.pattern as Pattern)) return { ok: false, error: `Peça ${i}: pattern invàlid` };
    if (!FITS.includes(gr.fit as Fit)) return { ok: false, error: `Peça ${i}: fit invàlid` };
    if (!Array.isArray(gr.seasons) || gr.seasons.some((s) => !SEASONS.includes(s as Season)))
      return { ok: false, error: `Peça ${i}: seasons invàlides` };
    if (typeof gr.size !== "string" || gr.size.trim() === "") return { ok: false, error: `Peça ${i}: size buit` };
    if (!Array.isArray(gr.colors) || gr.colors.length === 0 || gr.colors.some((c) => !isHex(c)))
      return { ok: false, error: `Peça ${i}: colors invàlids (cal array de hex #rrggbb)` };
  }

  return { ok: true, payload: b as unknown as ImportPayload };
}

export async function POST(req: NextRequest) {
  const importSecret = process.env.IMPORT_SECRET;
  if (importSecret) {
    const auth = req.headers.get("Authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (token !== importSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const mode = req.nextUrl.searchParams.get("mode") ?? "merge";

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invàlid" }, { status: 400 });
  }

  const result = validate(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });

  if (mode === "replace") {
    const existing = await findAllGarments();
    await Promise.all(existing.map((g) => deleteGarment(g.id)));
  }

  const created = await Promise.all(
    result.payload.garments.map((g) =>
      addGarment({
        category: g.category,
        texture: g.texture,
        pattern: g.pattern,
        seasons: g.seasons,
        size: g.size,
        fit: g.fit,
        notes: g.notes ?? undefined,
        hexColors: g.colors,
      })
    )
  );

  return NextResponse.json({ imported: created.length });
}
