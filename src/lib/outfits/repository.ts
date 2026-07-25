import { prisma } from "@/lib/prisma";
import { dayKey } from "./week";

const OUTFIT_GARMENTS_INCLUDE = {
  garments: {
    include: {
      garment: { include: { colors: true, seasons: true } },
    },
  },
} as const;

// A future calendar assignment is a plan, not history — "portat" (Desats)
// must only ever surface days that have actually happened, or a planned
// outfit reads as worn before you've worn it.
function outfitInclude() {
  return {
    ...OUTFIT_GARMENTS_INCLUDE,
    wornEvents: {
      where: { date: { lte: dayKey(new Date()) } },
      orderBy: { date: "desc" },
      take: 3,
    },
  } as const;
}

export async function findOutfitByGarmentsAndPalette(
  garmentIds: string[],
  paletteId: number
) {
  const sorted = [...garmentIds].sort();
  const outfits = await prisma.outfit.findMany({
    // Narrow in SQL to outfits of this palette wearing at least one of the
    // target garments as a primary piece; exact set-equality over primaries
    // stays in JS below because relational filters can't express it.
    where: {
      paletteId,
      garments: { some: { garmentId: { in: sorted }, role: "primary" } },
    },
    include: outfitInclude(),
  });
  // Duplicate-detection is scoped to primary pieces: two saves of the
  // same palette + same core garments are the same outfit, even if
  // extras (shoes / accessories) differ.
  return outfits.find((o) => {
    const ids = o.garments
      .filter((g) => g.role === "primary")
      .map((g) => g.garmentId)
      .sort();
    return ids.length === sorted.length && ids.every((id, i) => id === sorted[i]);
  }) ?? null;
}

export async function createOutfit(data: {
  name?: string;
  paletteId: number;
  garmentIds: string[];
}) {
  return prisma.outfit.create({
    data: {
      name: data.name ?? null,
      paletteId: data.paletteId,
      garments: {
        create: data.garmentIds.map((garmentId) => ({ garmentId, role: "primary" })),
      },
    },
    include: outfitInclude(),
  });
}

export async function addOutfitExtras(outfitId: string, garmentIds: string[]) {
  if (garmentIds.length === 0) return;
  await prisma.outfitGarment.createMany({
    data: garmentIds.map((garmentId) => ({ outfitId, garmentId, role: "extra" })),
  });
}

export async function removeOutfitExtra(outfitId: string, garmentId: string) {
  await prisma.outfitGarment.deleteMany({
    where: { outfitId, garmentId, role: "extra" },
  });
}

export async function findAllOutfits() {
  return prisma.outfit.findMany({
    include: outfitInclude(),
    orderBy: [{ favorite: "desc" }, { createdAt: "desc" }],
  });
}

export async function setOutfitFavorite(id: string, favorite: boolean) {
  return prisma.outfit.update({ where: { id }, data: { favorite } });
}

// `day` must already be truncated to midnight — the unique constraint on
// WornEvent.date is what enforces "one outfit per calendar day", so an
// upsert here both assigns an empty day and reassigns an occupied one.
export async function setWornDay(outfitId: string, day: Date) {
  return prisma.wornEvent.upsert({
    where: { date: day },
    update: { outfitId },
    create: { outfitId, date: day },
  });
}

export async function clearWornDay(day: Date) {
  await prisma.wornEvent.deleteMany({ where: { date: day } });
}

export async function findWornEventsInRange(start: Date, end: Date) {
  return prisma.wornEvent.findMany({
    where: { date: { gte: start, lte: end } },
    orderBy: { date: "asc" },
    include: { outfit: { include: OUTFIT_GARMENTS_INCLUDE } },
  });
}

export async function deleteOutfit(id: string) {
  return prisma.outfit.delete({ where: { id } });
}

export async function countOutfits(): Promise<number> {
  return prisma.outfit.count();
}
