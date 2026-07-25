import { prisma } from "@/lib/prisma";

const OUTFIT_INCLUDE = {
  garments: {
    include: {
      garment: { include: { colors: true, seasons: true } },
    },
  },
  wornEvents: {
    orderBy: { date: "desc" },
    take: 3,
  },
} as const;

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
    include: OUTFIT_INCLUDE,
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
    include: OUTFIT_INCLUDE,
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
    include: OUTFIT_INCLUDE,
    orderBy: [{ favorite: "desc" }, { createdAt: "desc" }],
  });
}

export async function setOutfitFavorite(id: string, favorite: boolean) {
  return prisma.outfit.update({ where: { id }, data: { favorite } });
}

export async function logWornEvent(outfitId: string) {
  return prisma.wornEvent.create({ data: { outfitId } });
}

// Only the most recent entry is undoable — older log entries stay
// permanent so the log can't be rewritten arbitrarily from the UI.
export async function undoLastWornEvent(outfitId: string) {
  const last = await prisma.wornEvent.findFirst({
    where: { outfitId },
    orderBy: { date: "desc" },
  });
  if (!last) return;
  await prisma.wornEvent.delete({ where: { id: last.id } });
}

export async function deleteOutfit(id: string) {
  return prisma.outfit.delete({ where: { id } });
}

export async function countOutfits(): Promise<number> {
  return prisma.outfit.count();
}
