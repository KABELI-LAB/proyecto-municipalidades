-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FichaAdopcion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "animalId" TEXT NOT NULL,
    "caracter" TEXT,
    "conviveConNinos" BOOLEAN,
    "conviveConAnimales" BOOLEAN,
    "estado" TEXT NOT NULL DEFAULT 'DISPONIBLE',
    "publicadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adoptadaEn" DATETIME,
    "adoptanteId" TEXT,
    "sectorAdoptanteId" TEXT,
    "loteDemoId" TEXT,
    "revision" TEXT NOT NULL DEFAULT 'APROBADA',
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "codigo" TEXT,
    "proponenteId" TEXT,
    "relacion" TEXT,
    "autorizaPublicar" BOOLEAN NOT NULL DEFAULT false,
    "saludTexto" TEXT,
    "hogarTexto" TEXT,
    "sectorId" TEXT,
    "localidadId" TEXT,
    "fotos" TEXT NOT NULL DEFAULT '',
    "huellasFotos" TEXT NOT NULL DEFAULT '',
    "motivoRevision" TEXT,
    "revisadaEn" DATETIME,
    "revisadoPorId" TEXT,
    "cierre" TEXT,
    CONSTRAINT "FichaAdopcion_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FichaAdopcion_adoptanteId_fkey" FOREIGN KEY ("adoptanteId") REFERENCES "Persona" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FichaAdopcion_sectorAdoptanteId_fkey" FOREIGN KEY ("sectorAdoptanteId") REFERENCES "Sector" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FichaAdopcion_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FichaAdopcion_proponenteId_fkey" FOREIGN KEY ("proponenteId") REFERENCES "Persona" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FichaAdopcion_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FichaAdopcion_localidadId_fkey" FOREIGN KEY ("localidadId") REFERENCES "Localidad" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FichaAdopcion_revisadoPorId_fkey" FOREIGN KEY ("revisadoPorId") REFERENCES "UsuarioMunicipal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
-- Las fichas existentes las publicó el municipio: nacen aprobadas y se crearon cuando se publicaron.
INSERT INTO "new_FichaAdopcion" ("adoptadaEn", "adoptanteId", "animalId", "caracter", "conviveConAnimales", "conviveConNinos", "estado", "id", "loteDemoId", "publicadaEn", "sectorAdoptanteId", "creadaEn") SELECT "adoptadaEn", "adoptanteId", "animalId", "caracter", "conviveConAnimales", "conviveConNinos", "estado", "id", "loteDemoId", "publicadaEn", "sectorAdoptanteId", "publicadaEn" FROM "FichaAdopcion";
DROP TABLE "FichaAdopcion";
ALTER TABLE "new_FichaAdopcion" RENAME TO "FichaAdopcion";
CREATE UNIQUE INDEX "FichaAdopcion_animalId_key" ON "FichaAdopcion"("animalId");
CREATE UNIQUE INDEX "FichaAdopcion_codigo_key" ON "FichaAdopcion"("codigo");
CREATE INDEX "FichaAdopcion_loteDemoId_idx" ON "FichaAdopcion"("loteDemoId");
CREATE INDEX "FichaAdopcion_revision_idx" ON "FichaAdopcion"("revision");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

