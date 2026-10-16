-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Persona" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipioId" TEXT NOT NULL,
    "rut" TEXT,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "correo" TEXT,
    "sectorId" TEXT NOT NULL,
    "localidadId" TEXT,
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loteDemoId" TEXT,
    CONSTRAINT "Persona_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Persona_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Persona_localidadId_fkey" FOREIGN KEY ("localidadId") REFERENCES "Localidad" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Persona_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Persona" ("correo", "creadaEn", "id", "localidadId", "loteDemoId", "municipioId", "nombre", "rut", "sectorId", "telefono") SELECT "correo", "creadaEn", "id", "localidadId", "loteDemoId", "municipioId", "nombre", "rut", "sectorId", "telefono" FROM "Persona";
DROP TABLE "Persona";
ALTER TABLE "new_Persona" RENAME TO "Persona";
CREATE INDEX "Persona_loteDemoId_idx" ON "Persona"("loteDemoId");
CREATE UNIQUE INDEX "Persona_municipioId_rut_key" ON "Persona"("municipioId", "rut");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

