import type { Category, Pattern, Texture, Season } from "./types";

export const CATEGORY_LABELS: Record<Category, string> = {
  SWEATER: "Jersei",
  SHIRT:   "Samarreta",
  PANTS:   "Pantalons",
  SOCKS:   "Mitjons",
  SHOES:   "Sabates",
  ACCESSORI: "Accessori",
};

export const TEXTURE_LABELS: Record<Texture, string> = {
  KNIT:       "Punt",
  DENIM:      "Denim",
  LINEN:      "Lli",
  COTTON:     "Cotó",
  POLYESTER:  "Poliester",
  LEATHER:    "Cuir",
  SYNTHETIC:  "Sintètic",
};

export const PATTERN_LABELS: Record<Pattern, string> = {
  PLAIN:     "Llis",
  STRIPES:   "Ratlles",
  CHECKS:    "Quadres",
  FLORAL:    "Flors",
  PRINTED:   "Estampat",
  GEOMETRIC: "Geomètric",
};

export const FIT_LABELS: Record<string, string> = {
  REGULAR:    "Regular",
  OVERSIZED:  "Oversized",
  CROPPED:    "Cropped",
  SLIM:       "Slim",
  STRAIGHT:   "Straight",
  SKINNY:     "Skinny",
  BAGGY:      "Baggy",
  BARREL:     "Barrel",
  WIDE_LEG:   "Wide Leg",
  CURT:       "Curt",
  TURMELL:    "Turmell",
  MITJA_CANYA:"Mitja canya",
  GENOLLERA:  "Genollera",
  LOW_TOP:    "Low Top",
  MID:        "Mid",
  HIGH_TOP:   "High Top",
};

export const SUBTYPE_LABELS: Record<string, string> = {
  PULLOVER: "Pullover",
  ZIP:      "Zip",
  HOODIE:   "Hoodie",
  CARDIGAN: "Cardigan",
  TEE:      "Samarreta",
  POLO:     "Polo",
  CAMISA:   "Camisa",
  VAQUERS:  "Vaquers",
  CHINO:    "Chino",
  JOGGER:   "Jogger",
  CARGO:    "Cargo",
  SNEAKER:  "Sneaker",
  BOTA:     "Bota",
  LOAFER:   "Loafer",
  SANDALIA: "Sandàlia",
  OXFORD:   "Oxford",
  ANELL:    "Anell",
  RELLOTGE: "Rellotge",
  CINTURO:  "Cinturó",
  BOSSA:    "Bossa",
  BARRET:   "Barret",
  BUFANDA:  "Bufanda",
  ULLERES:  "Ulleres",
};

export const LENGTH_LABELS: Record<string, string> = {
  SHORT: "Curts",
  LONG:  "Llargs",
};

export const SEASON_LABELS: Record<Season, string> = {
  SPRING:   "Primavera",
  SUMMER:   "Estiu",
  AUTUMN:   "Tardor",
  WINTER:   "Hivern",
  ALL_YEAR: "Tot l'any",
};
