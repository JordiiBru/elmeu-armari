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

// Same rule as the garment repository: the owner's id is in every `where`,
// and there is no lookup by a bare id. A day is unique per account and date.
export async function findOutfitByGarmentsAndPalette(
  userId: string,
  garmentIds: string[],
  paletteId: number
) {
  const sorted = [...garmentIds].sort();
  const outfits = await prisma.outfit.findMany({
    // Narrow in SQL to outfits of this palette wearing at least one of the
    // target garments; exact set-equality stays in JS below because
    // relational filters can't express it.
    where: {
      userId,
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

export async function findOutfitById(userId: string, id: string) {
  return prisma.outfit.findFirst({ where: { id, userId }, include: outfitInclude() });
}

export async function createOutfit(userId: string, data: {
  name?: string;
  paletteId: number;
  garmentIds: string[];
}) {
  return prisma.outfit.create({
    data: {
      userId,
      name: data.name ?? null,
      paletteId: data.paletteId,
      // Saving an outfit is already the deliberate keep action (the
      // combiner greys out ones you own), so it starts in "què em poso?"
      // rather than behind a second, separate favouriting step.
      favorite: true,
      garments: {
        create: data.garmentIds.map((garmentId) => ({ garmentId })),
      },
    },
    include: outfitInclude(),
  });
}

export async function setOutfitFavorite(userId: string, id: string, favorite: boolean) {
  return prisma.outfit.updateMany({ where: { id, userId }, data: { favorite } });
}

export async function findAllOutfits(userId: string) {
  return prisma.outfit.findMany({
    where: { userId },
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
export async function setWornDay(
  userId: string,
  outfitId: string,
  day: Date,
  garmentIds: string[],
) {
  return prisma.$transaction(async (tx) => {
    const event = await tx.wornEvent.upsert({
      where: { userId_date: { userId, date: day } },
      update: { outfitId },
      create: { userId, outfitId, date: day },
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

export async function clearWornDay(userId: string, day: Date) {
  await prisma.wornEvent.deleteMany({ where: { userId, date: day } });
}

export async function findWornEventById(userId: string, id: string) {
  return prisma.wornEvent.findFirst({ where: { id, userId } });
}

export async function setWornEventImage(userId: string, id: string, image: string | null) {
  return prisma.wornEvent.updateMany({ where: { id, userId }, data: { image } });
}

/** Every day that carries a photo. The export walks it, and so does
 * whatever is about to delete rows that own files on disk. */
export async function findWornEventImages(
  userId: string,
  where: { outfitId?: string; date?: Date } = {},
) {
  const rows = await prisma.wornEvent.findMany({
    where: { ...where, userId, image: { not: null } },
    select: { id: true, image: true },
  });
  return rows as { id: string; image: string }[];
}

export async function findUnsettledPastWornEvents(userId: string, beforeDay: Date) {
  return prisma.wornEvent.findMany({
    where: { userId, date: { lt: beforeDay }, settledAt: null },
    include: { outfit: { include: GARMENTS_INCLUDE } },
  });
}

export async function markWornEventSettled(userId: string, id: string) {
  return prisma.wornEvent.updateMany({ where: { id, userId }, data: { settledAt: new Date() } });
}

export async function findWornEventForDay(userId: string, day: Date) {
  return prisma.wornEvent.findUnique({
    where: { userId_date: { userId, date: day } },
    include: { outfit: { include: outfitInclude() }, ...GARMENTS_INCLUDE },
  });
}

export async function findWornEventsInRange(userId: string, start: Date, end: Date) {
  return prisma.wornEvent.findMany({
    where: { userId, date: { gte: start, lte: end } },
    orderBy: { date: "asc" },
    include: { outfit: { include: outfitInclude() }, ...GARMENTS_INCLUDE },
  });
}

export async function deleteOutfit(userId: string, id: string) {
  return prisma.outfit.delete({ where: { id, userId } });
}

export async function countOutfits(userId: string): Promise<number> {
  return prisma.outfit.count({ where: { userId } });
}
