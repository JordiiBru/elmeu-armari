import { prisma } from "@/lib/prisma";

export async function findColoresByPrenda(prendaId: string) {
  return prisma.color.findMany({ where: { prendaId } });
}
