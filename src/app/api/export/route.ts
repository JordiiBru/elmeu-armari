import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/api";
import { findAllGarments } from "@/lib/prendas/service";

export async function GET() {
  const denied = await requireSession();
  if (denied) return denied;

  const garments = await findAllGarments();

  const data = garments.map((g) => ({
    id: g.id,
    category: g.category,
    texture: g.texture,
    pattern: g.pattern,
    seasons: g.seasons.map((s) => s.season),
    size: g.size,
    subtype: g.subtype,
    length: g.length,
    fit: g.fit,
    notes: g.notes,
    colors: g.colors.map((c) => c.hex),
    createdAt: g.createdAt.toISOString(),
  }));

  const payload = { version: 3, exportedAt: new Date().toISOString(), garments: data };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="elmeu-armari-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
