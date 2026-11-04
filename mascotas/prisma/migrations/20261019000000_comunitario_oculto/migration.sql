-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PerroComunitario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "animalId" TEXT NOT NULL,
    "apodo" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "lugarId" TEXT NOT NULL,
    "cuidadores" TEXT NOT NULL,
    "ultimoControl" DATETIME,
    "necesitaAtencion" BOOLEAN NOT NULL DEFAULT false,
    "lat" REAL,
    "lng" REAL,
    "fotos" TEXT NOT NULL DEFAULT '',
    "loteDemoId" TEXT,
    "fichaRevisadaEn" DATETIME,
    "fichaRevisadaPorId" TEXT,
    "oculto" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "PerroComunitario_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PerroComunitario_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PerroComunitario_lugarId_fkey" FOREIGN KEY ("lugarId") REFERENCES "Lugar" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PerroComunitario_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PerroComunitario_fichaRevisadaPorId_fkey" FOREIGN KEY ("fichaRevisadaPorId") REFERENCES "UsuarioMunicipal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PerroComunitario" ("animalId", "apodo", "cuidadores", "fichaRevisadaEn", "fichaRevisadaPorId", "fotos", "id", "lat", "lng", "loteDemoId", "lugarId", "necesitaAtencion", "sectorId", "ultimoControl") SELECT "animalId", "apodo", "cuidadores", "fichaRevisadaEn", "fichaRevisadaPorId", "fotos", "id", "lat", "lng", "loteDemoId", "lugarId", "necesitaAtencion", "sectorId", "ultimoControl" FROM "PerroComunitario";
DROP TABLE "PerroComunitario";
ALTER TABLE "new_PerroComunitario" RENAME TO "PerroComunitario";
CREATE UNIQUE INDEX "PerroComunitario_animalId_key" ON "PerroComunitario"("animalId");
CREATE INDEX "PerroComunitario_loteDemoId_idx" ON "PerroComunitario"("loteDemoId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

