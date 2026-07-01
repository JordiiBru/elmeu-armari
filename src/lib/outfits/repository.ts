import { prisma } from "@/lib/prisma";

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
    include: {
      garments: {
        include: {
          garment: { include: { colors: true, seasons: true } },
        },
      },
    },
  });
}

export async function findAllOutfits() {
  return prisma.outfit.findMany({
    include: {
      garments: {
        include: {
          garment: { include: { colors: true, seasons: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteOutfit(id: string) {
  return prisma.outfit.delete({ where: { id } });
}

export async function countOutfits(): Promise<number> {
  return prisma.outfit.count();
}
