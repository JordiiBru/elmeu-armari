import { prisma } from "@/lib/prisma";
import type { Categoria, Dibujo, Fit, Textura } from "@/generated/prisma/enums";

export async function findAllPrendas() {
  return prisma.prenda.findMany({
    include: { colores: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function findPrendaById(id: string) {
  return prisma.prenda.findUnique({
    where: { id },
    include: { colores: true },
  });
}

export async function createPrenda(data: {
  categoria: Categoria;
  textura: Textura;
  dibujo: Dibujo;
  temporada: string;
  talla: string;
  fit: Fit;
  nota?: string;
  hexColores: string[];
}) {
  return prisma.prenda.create({
    data: {
      categoria: data.categoria,
      textura: data.textura,
      dibujo: data.dibujo,
      temporada: data.temporada,
      talla: data.talla,
      fit: data.fit,
      nota: data.nota ?? null,
      colores: {
        create: data.hexColores.map((hex) => ({ hex })),
      },
    },
    include: { colores: true },
  });
}

export async function updatePrenda(
  id: string,
  data: {
    categoria: Categoria;
    textura: Textura;
    dibujo: Dibujo;
    temporada: string;
    talla: string;
    fit: Fit;
    nota?: string;
    hexColores: string[];
  }
) {
  await prisma.color.deleteMany({ where: { prendaId: id } });
  return prisma.prenda.update({
    where: { id },
    data: {
      categoria: data.categoria,
      textura: data.textura,
      dibujo: data.dibujo,
      temporada: data.temporada,
      talla: data.talla,
      fit: data.fit,
      nota: data.nota ?? null,
      colores: {
        create: data.hexColores.map((hex) => ({ hex })),
      },
    },
    include: { colores: true },
  });
}

export async function deletePrenda(id: string) {
  return prisma.prenda.delete({ where: { id } });
}
