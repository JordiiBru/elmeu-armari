import {
  findAllPrendas,
  findPrendaById,
  createPrenda,
  updatePrenda,
  deletePrenda,
} from "./repository";
import type { Categoria, Dibujo, Fit, Textura } from "./types";

export { findAllPrendas, findPrendaById, deletePrenda };

export async function addPrenda(data: {
  categoria: Categoria;
  textura: Textura;
  dibujo: Dibujo;
  temporada: string[];
  talla: string;
  fit: Fit;
  nota?: string;
  hexColores: string[];
}) {
  return createPrenda({
    ...data,
    temporada: JSON.stringify(data.temporada),
  });
}

export async function editPrenda(
  id: string,
  data: {
    categoria: Categoria;
    textura: Textura;
    dibujo: Dibujo;
    temporada: string[];
    talla: string;
    fit: Fit;
    nota?: string;
    hexColores: string[];
  }
) {
  return updatePrenda(id, {
    ...data,
    temporada: JSON.stringify(data.temporada),
  });
}

export function parseTemporada(raw: string): string[] {
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}
