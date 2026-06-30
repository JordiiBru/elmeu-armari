-- CreateTable
CREATE TABLE "Prenda" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoria" TEXT NOT NULL,
    "textura" TEXT NOT NULL,
    "dibujo" TEXT NOT NULL,
    "temporada" TEXT NOT NULL,
    "talla" TEXT NOT NULL,
    "fit" TEXT NOT NULL,
    "nota" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Color" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hex" TEXT NOT NULL,
    "prendaId" TEXT NOT NULL,
    CONSTRAINT "Color_prendaId_fkey" FOREIGN KEY ("prendaId") REFERENCES "Prenda" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
