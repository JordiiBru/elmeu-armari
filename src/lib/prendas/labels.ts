import type { Category, Pattern, Fit, Texture, Season } from "./types";

export const CATEGORY_LABELS: Record<Category, string> = {
  SWEATER: "Jersei",
  SHIRT: "Camisa",
  PANTS: "Pantalons",
  SOCKS: "Mitjons",
  SHOES: "Sabates",
};

export const TEXTURE_LABELS: Record<Texture, string> = {
  KNIT: "Punt",
  DENIM: "Denim",
  LINEN: "Lli",
  COTTON: "Cotó",
  POLYESTER: "Poliester",
  LEATHER: "Cuir",
  SYNTHETIC: "Sintètic",
};

export const PATTERN_LABELS: Record<Pattern, string> = {
  PLAIN: "Llis",
  STRIPES: "Ratlles",
  CHECKS: "Quadres",
  FLORAL: "Flors",
  PRINTED: "Estampat",
  GEOMETRIC: "Geomètric",
};

export const FIT_LABELS: Record<Fit, string> = {
  OVERSIZED: "Oversized",
  STRAIGHT: "Straight",
  CROPPED: "Cropped",
  SLIM: "Slim",
  BAGGY: "Baggy",
  REGULAR: "Regular",
};

export const SEASON_LABELS: Record<Season, string> = {
  SPRING: "Primavera",
  SUMMER: "Estiu",
  AUTUMN: "Tardor",
  WINTER: "Hivern",
  ALL_YEAR: "Tot l'any",
};
