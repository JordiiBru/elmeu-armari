-- Rename Prenda → Garment, translate all enum values and field names to English
-- Season values stored as JSON strings are migrated via REPLACE

CREATE TABLE "Garment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "texture" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "fit" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "Garment" ("id", "category", "texture", "pattern", "season", "size", "fit", "notes", "createdAt", "updatedAt")
SELECT
    "id",
    CASE "categoria"
        WHEN 'JERSEI'     THEN 'SWEATER'
        WHEN 'CAMISA'     THEN 'SHIRT'
        WHEN 'PANTALONES' THEN 'PANTS'
        WHEN 'CALCETINES' THEN 'SOCKS'
        WHEN 'ZAPATOS'    THEN 'SHOES'
        ELSE "categoria"
    END,
    CASE "textura"
        WHEN 'PUNTO'     THEN 'KNIT'
        WHEN 'DENIM'     THEN 'DENIM'
        WHEN 'LINO'      THEN 'LINEN'
        WHEN 'ALGODON'   THEN 'COTTON'
        WHEN 'POLIESTER' THEN 'POLYESTER'
        WHEN 'CUERO'     THEN 'LEATHER'
        WHEN 'SINTETICO' THEN 'SYNTHETIC'
        ELSE "textura"
    END,
    CASE "dibujo"
        WHEN 'LISO'       THEN 'PLAIN'
        WHEN 'RAYAS'      THEN 'STRIPES'
        WHEN 'CUADROS'    THEN 'CHECKS'
        WHEN 'FLORES'     THEN 'FLORAL'
        WHEN 'ESTAMPADO'  THEN 'PRINTED'
        WHEN 'GEOMETRICO' THEN 'GEOMETRIC'
        ELSE "dibujo"
    END,
    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE("temporada",
        '"PRIMAVERA"',   '"SPRING"'),
        '"VERANO"',      '"SUMMER"'),
        '"OTONO"',       '"AUTUMN"'),
        '"INVIERNO"',    '"WINTER"'),
        '"TODO_EL_ANIO"','"ALL_YEAR"'),
    "talla",
    "fit",
    "nota",
    "createdAt",
    "updatedAt"
FROM "Prenda";

CREATE TABLE "new_Color" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hex" TEXT NOT NULL,
    "garmentId" TEXT NOT NULL,
    CONSTRAINT "Color_garmentId_fkey" FOREIGN KEY ("garmentId") REFERENCES "Garment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Color" ("id", "hex", "garmentId") SELECT "id", "hex", "prendaId" FROM "Color";

DROP TABLE "Color";
ALTER TABLE "new_Color" RENAME TO "Color";
DROP TABLE "Prenda";

CREATE INDEX "Color_garmentId_idx" ON "Color"("garmentId");
