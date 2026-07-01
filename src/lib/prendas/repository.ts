import { prisma } from "@/lib/prisma";
import type { Category, Pattern, Fit, Texture } from "@/generated/prisma/enums";

export async function findAllGarments() {
  return prisma.garment.findMany({
    include: { colors: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function findGarmentById(id: string) {
  return prisma.garment.findUnique({
    where: { id },
    include: { colors: true },
  });
}

export async function createGarment(data: {
  category: Category;
  texture: Texture;
  pattern: Pattern;
  season: string;
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
      season: data.season,
      size: data.size,
      fit: data.fit,
      notes: data.notes ?? null,
      colors: {
        create: data.hexColors.map((hex) => ({ hex })),
      },
    },
    include: { colors: true },
  });
}

export async function updateGarment(
  id: string,
  data: {
    category: Category;
    texture: Texture;
    pattern: Pattern;
    season: string;
    size: string;
    fit: Fit;
    notes?: string;
    hexColors: string[];
  }
) {
  await prisma.color.deleteMany({ where: { garmentId: id } });
  return prisma.garment.update({
    where: { id },
    data: {
      category: data.category,
      texture: data.texture,
      pattern: data.pattern,
      season: data.season,
      size: data.size,
      fit: data.fit,
      notes: data.notes ?? null,
      colors: {
        create: data.hexColors.map((hex) => ({ hex })),
      },
    },
    include: { colors: true },
  });
}

export async function deleteGarment(id: string) {
  return prisma.garment.delete({ where: { id } });
}
