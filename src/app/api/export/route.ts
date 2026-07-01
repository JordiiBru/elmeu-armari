import { NextResponse } from "next/server";
import { findAllPrendas } from "@/lib/prendas/service";

export async function GET() {
  const prendas = await findAllPrendas();

  const data = prendas.map((p) => ({
    id: p.id,
    categoria: p.categoria,
    textura: p.textura,
    dibujo: p.dibujo,
    temporada: JSON.parse(p.temporada) as string[],
    talla: p.talla,
    fit: p.fit,
    nota: p.nota,
    colores: p.colores.map((c) => c.hex),
    createdAt: p.createdAt.toISOString(),
  }));

  const payload = { version: 1, exportedAt: new Date().toISOString(), prendas: data };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="elmeu-armari-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
