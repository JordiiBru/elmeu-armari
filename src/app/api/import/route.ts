import { NextRequest, NextResponse } from "next/server";
import { addPrenda, findAllPrendas, deletePrenda } from "@/lib/prendas/service";
import { CATEGORIAS, TEXTURAS, DIBUJOS, FITS, TEMPORADAS } from "@/lib/prendas/types";

interface PrendaImport {
  categoria: string;
  textura: string;
  dibujo: string;
  temporada: string[];
  talla: string;
  fit: string;
  nota?: string | null;
  colores: string[];
}

interface ImportPayload {
  version: number;
  prendas: PrendaImport[];
}

function isHex(s: string) {
  return /^#[0-9a-fA-F]{6}$/.test(s);
}

function validate(body: unknown): { ok: true; payload: ImportPayload } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) return { ok: false, error: "Format invàlid" };
  const b = body as Record<string, unknown>;
  if (b.version !== 1) return { ok: false, error: "Versió no suportada" };
  if (!Array.isArray(b.prendas)) return { ok: false, error: "Camp 'prendas' obligatori" };

  for (const [i, p] of (b.prendas as unknown[]).entries()) {
    if (typeof p !== "object" || p === null) return { ok: false, error: `Peça ${i}: format invàlid` };
    const pr = p as Record<string, unknown>;
    if (!CATEGORIAS.includes(pr.categoria as never)) return { ok: false, error: `Peça ${i}: categoria invàlida` };
    if (!TEXTURAS.includes(pr.textura as never)) return { ok: false, error: `Peça ${i}: textura invàlida` };
    if (!DIBUJOS.includes(pr.dibujo as never)) return { ok: false, error: `Peça ${i}: dibujo invàlid` };
    if (!FITS.includes(pr.fit as never)) return { ok: false, error: `Peça ${i}: fit invàlid` };
    if (!Array.isArray(pr.temporada) || pr.temporada.some((t) => !TEMPORADAS.includes(t as never)))
      return { ok: false, error: `Peça ${i}: temporada invàlida` };
    if (typeof pr.talla !== "string" || pr.talla.trim() === "") return { ok: false, error: `Peça ${i}: talla buida` };
    if (!Array.isArray(pr.colores) || pr.colores.length === 0 || pr.colores.some((c) => !isHex(c)))
      return { ok: false, error: `Peça ${i}: colors invàlids (cal array de hex #rrggbb)` };
  }

  return { ok: true, payload: b as unknown as ImportPayload };
}

export async function POST(req: NextRequest) {
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
    const existing = await findAllPrendas();
    await Promise.all(existing.map((p) => deletePrenda(p.id)));
  }

  const created = await Promise.all(
    result.payload.prendas.map((p) =>
      addPrenda({
        categoria: p.categoria as never,
        textura: p.textura as never,
        dibujo: p.dibujo as never,
        temporada: p.temporada,
        talla: p.talla,
        fit: p.fit as never,
        nota: p.nota ?? undefined,
        hexColores: p.colores,
      })
    )
  );

  return NextResponse.json({ imported: created.length });
}
