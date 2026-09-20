import { prisma } from "@/lib/prisma";
import type { GarmentInput } from "./types";

/**
 * Every function here takes the owner's id and puts it in the `where`: a
 * wardrobe belongs to one account, and an id that arrives from the client
 * (a garment in a form, a link, a request body) only ever resolves inside
 * that account. There is deliberately no lookup by bare id.
 */
export async function findAllGarments(userId: string) {
  return prisma.garment.findMany({
    where: { userId },
    include: { colors: true, seasons: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function findGarmentById(userId: string, id: string) {
  return prisma.garment.findFirst({
    where: { id, userId },
    include: { colors: true, seasons: true },
  });
}

/** Resolves the short id suffix used in a garment's slug URL back to a
 * garment. Collisions are astronomically unlikely at this catalog's scale
 * (a personal wardrobe), so the first match is good enough. */
export async function findGarmentByIdSuffix(userId: string, suffix: string) {
  return prisma.garment.findFirst({
    where: { userId, id: { endsWith: suffix } },
    include: { colors: true, seasons: true },
  });
}

export async function createGarment(userId: string, data: GarmentInput) {
  return prisma.garment.create({
    data: {
      userId,
      category: data.category,
      texture: data.texture,
      pattern: data.pattern,
      size: data.size,
      subtype: data.subtype,
      length: data.length,
      fit: data.fit,
      cropped: data.cropped,
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

export async function updateGarment(userId: string, id: string, data: GarmentInput) {
  return prisma.$transaction(async (tx) => {
    const owned = await tx.garment.findFirst({ where: { id, userId }, select: { id: true } });
    if (!owned) throw new Error(`Garment not found: ${id}`);
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
        length: data.length,
        fit: data.fit,
        cropped: data.cropped,
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

export async function findGarmentCategories(userId: string, ids: string[]) {
  return prisma.garment.findMany({
    where: { userId, id: { in: ids } },
    select: { id: true, category: true },
  });
}

/**
 * Marking as dirty only touches garments that are currently clean: a piece
 * already in the basket keeps its original `dirtySince`, so "how long has
 * this been waiting" stays truthful. The returned count is therefore the
 * number of garments that actually changed state.
 */
export async function setGarmentsDirtyState(userId: string, ids: string[], dirty: boolean) {
  return prisma.garment.updateMany({
    where: dirty
      ? { userId, id: { in: ids }, dirtySince: null }
      : { userId, id: { in: ids } },
    data: { dirtySince: dirty ? new Date() : null },
  });
}

export async function setGarmentImage(userId: string, id: string, filename: string | null) {
  return prisma.garment.updateMany({ where: { id, userId }, data: { image: filename } });
}

export async function deleteGarment(userId: string, id: string) {
  // A saved outfit is a specific curation of pieces; if one of its
  // pieces disappears the outfit itself is no longer meaningful. So
  // we drop every outfit that referenced the garment before deleting
  // the garment. OutfitGarment rows go away by cascade in both steps.
  return prisma.$transaction(async (tx) => {
    const owned = await tx.garment.findFirst({ where: { id, userId }, select: { id: true } });
    if (!owned) throw new Error(`Garment not found: ${id}`);
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
