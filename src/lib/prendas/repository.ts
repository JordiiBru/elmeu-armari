import { prisma } from "@/lib/prisma";
import type { Category, Pattern, Fit, Texture, Season } from "@/generated/prisma/enums";

export async function findAllGarments() {
  return prisma.garment.findMany({
    include: { colors: true, seasons: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function findGarmentById(id: string) {
  return prisma.garment.findUnique({
    where: { id },
    include: { colors: true, seasons: true },
  });
}

export async function createGarment(data: {
  category: Category;
  texture: Texture;
  pattern: Pattern;
  seasons: Season[];
  size: string;
  fit: Fit;
  notes?: string;
  hexColors: string[];
}) {
  return prisma.garment.create({
    data: {
      category: data.category,
      texture: data.texture,
      pattern: data.pattern,
      size: data.size,
      fit: data.fit,
      notes: data.notes ?? null,
      colors: {
        create: data.hexColors.map((hex) => ({ hex })),
      },
      seasons: {
        create: data.seasons.map((season) => ({ season })),
      },
    },
    include: { colors: true, seasons: true },
  });
}

export async function updateGarment(
  id: string,
  data: {
    category: Category;
    texture: Texture;
    pattern: Pattern;
    seasons: Season[];
    size: string;
    fit: Fit;
    notes?: string;
    hexColors: string[];
  }
) {
  return prisma.$transaction(async (tx) => {
    await tx.color.deleteMany({ where: { garmentId: id } });
    await tx.garmentSeason.deleteMany({ where: { garmentId: id } });
    return tx.garment.update({
      where: { id },
      data: {
        category: data.category,
        texture: data.texture,
        pattern: data.pattern,
        size: data.size,
        fit: data.fit,
        notes: data.notes ?? null,
        colors: {
          create: data.hexColors.map((hex) => ({ hex })),
        },
        seasons: {
          create: data.seasons.map((season) => ({ season })),
        },
      },
      include: { colors: true, seasons: true },
    });
  });
}

export async function deleteGarment(id: string) {
  return prisma.garment.delete({ where: { id } });
}
