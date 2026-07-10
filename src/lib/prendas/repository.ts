import { prisma } from "@/lib/prisma";
import type { Category, Pattern, Texture, Season } from "@/generated/prisma/enums";

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
  subtype: string | null;
  length: string | null;
  fit: string;
  notes?: string;
  hexColors: string[];
}) {
  return prisma.garment.create({
    data: {
      category: data.category,
      texture: data.texture,
      pattern: data.pattern,
      size: data.size,
      subtype: data.subtype,
      length: data.length,
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
    subtype: string | null;
    fit: string;
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
        subtype: data.subtype,
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
  // A saved outfit is a specific curation of pieces; if one of its
  // pieces disappears the outfit itself is no longer meaningful. So
  // we drop every outfit that referenced the garment before deleting
  // the garment. OutfitGarment rows go away by cascade in both steps.
  return prisma.$transaction(async (tx) => {
    const affectedOutfits = await tx.outfitGarment.findMany({
      where: { garmentId: id },
      select: { outfitId: true },
    });
    const outfitIds = Array.from(
      new Set(affectedOutfits.map((o) => o.outfitId)),
    );
    if (outfitIds.length > 0) {
      await tx.outfit.deleteMany({ where: { id: { in: outfitIds } } });
    }
    return tx.garment.delete({ where: { id } });
  });
}
