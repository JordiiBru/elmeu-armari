import { prisma } from "@/lib/prisma";

const OUTFIT_INCLUDE = {
  garments: {
    include: {
      garment: { include: { colors: true, seasons: true } },
    },
  },
} as const;

export async function findOutfitByGarmentsAndPalette(
  garmentIds: string[],
  paletteId: number
) {
  const sorted = [...garmentIds].sort();
  const outfits = await prisma.outfit.findMany({
    where: { paletteId },
    include: OUTFIT_INCLUDE,
  });
  return outfits.find((o) => {
    const ids = o.garments.map((g) => g.garmentId).sort();
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
        create: data.garmentIds.map((garmentId) => ({ garmentId })),
      },
    },
    include: OUTFIT_INCLUDE,
  });
}

export async function findAllOutfits() {
  return prisma.outfit.findMany({
    include: OUTFIT_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteOutfit(id: string) {
  return prisma.outfit.delete({ where: { id } });
}

export async function countOutfits(): Promise<number> {
  return prisma.outfit.count();
}
