import { prisma } from "@/lib/prisma";
import { today } from "./week";

const GARMENT_INCLUDE = { include: { colors: true, seasons: true } } as const;

// Both an outfit and a worn day join to garments through the same shape,
// so one constant covers the two.
const GARMENTS_INCLUDE = {
  garments: { include: { garment: GARMENT_INCLUDE } },
} as const;

// A future calendar assignment is a plan, not history — "portat" (Desats)
// must only ever surface days that have actually happened, or a planned
// outfit reads as worn before you've worn it.
function outfitInclude() {
  return {
    ...GARMENTS_INCLUDE,
    wornEvents: {
      where: { date: { lte: today() } },
      orderBy: { date: "desc" },
      take: 3,
      include: GARMENTS_INCLUDE,
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
    // target garments; exact set-equality stays in JS below because
    // relational filters can't express it.
    where: {
      paletteId,
      garments: { some: { garmentId: { in: sorted } } },
    },
    include: outfitInclude(),
  });
  return outfits.find((o) => {
    const ids = o.garments.map((g) => g.garmentId).sort();
    return ids.length === sorted.length && ids.every((id, i) => id === sorted[i]);
  }) ?? null;
}

export async function findOutfitById(id: string) {
  return prisma.outfit.findUnique({ where: { id }, include: outfitInclude() });
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
        create: data.garmentIds.map((garmentId) => ({ garmentId })),
      },
    },
    include: outfitInclude(),
  });
}

export async function findAllOutfits() {
  return prisma.outfit.findMany({
    include: outfitInclude(),
    // Newest first. Every surface re-ranks for the day on top of this,
    // so this only decides ties.
    orderBy: { createdAt: "desc" },
  });
}

// `day` must already be truncated to midnight — the unique constraint on
// WornEvent.date is what enforces "one outfit per calendar day", so an
// upsert here both assigns an empty day and reassigns an occupied one.
// The garments are replaced rather than merged, so re-deciding a day
// (different outfit, different shoes) is idempotent.
export async function setWornDay(outfitId: string, day: Date, garmentIds: string[]) {
  return prisma.$transaction(async (tx) => {
    const event = await tx.wornEvent.upsert({
      where: { date: day },
      update: { outfitId },
      create: { outfitId, date: day },
    });
    await tx.wornEventGarment.deleteMany({ where: { wornEventId: event.id } });
    if (garmentIds.length > 0) {
      await tx.wornEventGarment.createMany({
        data: garmentIds.map((garmentId) => ({ wornEventId: event.id, garmentId })),
      });
    }
    return event;
  });
}

export async function clearWornDay(day: Date) {
  await prisma.wornEvent.deleteMany({ where: { date: day } });
}

export async function findUnsettledPastWornEvents(beforeDay: Date) {
  return prisma.wornEvent.findMany({
    where: { date: { lt: beforeDay }, settledAt: null },
    include: { outfit: { include: GARMENTS_INCLUDE } },
  });
}

export async function markWornEventSettled(id: string) {
  return prisma.wornEvent.update({ where: { id }, data: { settledAt: new Date() } });
}

export async function findWornEventForDay(day: Date) {
  return prisma.wornEvent.findUnique({
    where: { date: day },
    include: { outfit: { include: outfitInclude() }, ...GARMENTS_INCLUDE },
  });
}

export async function findWornEventsInRange(start: Date, end: Date) {
  return prisma.wornEvent.findMany({
    where: { date: { gte: start, lte: end } },
    orderBy: { date: "asc" },
    include: { outfit: { include: outfitInclude() }, ...GARMENTS_INCLUDE },
  });
}

export async function deleteOutfit(id: string) {
  return prisma.outfit.delete({ where: { id } });
}

export async function countOutfits(): Promise<number> {
  return prisma.outfit.count();
}
