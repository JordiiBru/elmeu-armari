import type { Categoria, Dibujo, Fit, Textura, Temporada } from "./types";

export const CATEGORIA_LABELS: Record<Categoria, string> = {
  JERSEI: "Jersei",
  CAMISA: "Camisa",
  PANTALONES: "Pantalons",
  CALCETINES: "Mitjons",
  ZAPATOS: "Sabates",
};

export const TEXTURA_LABELS: Record<Textura, string> = {
  PUNTO: "Punt",
  DENIM: "Denim",
  LINO: "Lli",
  ALGODON: "Cotó",
  POLIESTER: "Poliester",
  CUERO: "Cuir",
  SINTETICO: "Sintètic",
};

export const DIBUJO_LABELS: Record<Dibujo, string> = {
  LISO: "Llis",
  RAYAS: "Ratlles",
  CUADROS: "Quadres",
  FLORES: "Flors",
  ESTAMPADO: "Estampat",
  GEOMETRICO: "Geomètric",
};

export const FIT_LABELS: Record<Fit, string> = {
  OVERSIZED: "Oversized",
  STRAIGHT: "Straight",
  CROPPED: "Cropped",
  SLIM: "Slim",
  BAGGY: "Baggy",
  REGULAR: "Regular",
};

export const TEMPORADA_LABELS: Record<Temporada, string> = {
  PRIMAVERA: "Primavera",
  VERANO: "Estiu",
  OTONO: "Tardor",
  INVIERNO: "Hivern",
  TODO_EL_ANIO: "Tot l'any",
};
