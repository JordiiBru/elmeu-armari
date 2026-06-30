import type { Categoria, Dibujo, Fit, Textura } from "@/generated/prisma/enums";

export type { Categoria, Dibujo, Fit, Textura };

export const CATEGORIAS: Categoria[] = ["JERSEI", "CAMISA", "PANTALONES", "CALCETINES", "ZAPATOS"];
export const TEXTURAS: Textura[] = ["PUNTO", "DENIM", "LINO", "ALGODON", "POLIESTER", "CUERO", "SINTETICO"];
export const DIBUJOS: Dibujo[] = ["LISO", "RAYAS", "CUADROS", "FLORES", "ESTAMPADO", "GEOMETRICO"];
export const FITS: Fit[] = ["OVERSIZED", "STRAIGHT", "CROPPED", "SLIM", "BAGGY", "REGULAR"];
export const TEMPORADAS = ["PRIMAVERA", "VERANO", "OTONO", "INVIERNO", "TODO_EL_ANIO"] as const;
export type Temporada = (typeof TEMPORADAS)[number];

export interface PrendaConColores {
  id: string;
  categoria: Categoria;
  textura: Textura;
  dibujo: Dibujo;
  temporada: string;
  talla: string;
  fit: Fit;
  nota: string | null;
  createdAt: Date;
  updatedAt: Date;
  colores: { id: string; hex: string; prendaId: string }[];
}
