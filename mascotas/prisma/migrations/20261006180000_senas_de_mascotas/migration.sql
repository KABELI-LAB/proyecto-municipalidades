-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PublicacionMascota" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "especie" TEXT NOT NULL,
    "sexo" TEXT NOT NULL DEFAULT 'DESCONOCIDO',
    "tamano" TEXT,
    "colorPrincipal" TEXT NOT NULL,
    "nombreAnimal" TEXT,
    "collar" TEXT,
    "colorCollar" TEXT,
    "microchip" TEXT,
    "senas" TEXT,
    "fotoUrl" TEXT,
    "sectorId" TEXT NOT NULL,
    "fechaEvento" DATETIME NOT NULL,
    "resguardada" BOOLEAN,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTA',
    "moderacion" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "personaId" TEXT NOT NULL,
    "vigenteHasta" DATETIME NOT NULL,
    "reencuentroPorCoincidencia" BOOLEAN,
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resueltaEn" DATETIME,
    "loteDemoId" TEXT,
    CONSTRAINT "PublicacionMascota_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PublicacionMascota_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PublicacionMascota_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PublicacionMascota" ("codigo", "colorPrincipal", "creadaEn", "especie", "estado", "fechaEvento", "fotoUrl", "id", "loteDemoId", "moderacion", "personaId", "reencuentroPorCoincidencia", "resguardada", "resueltaEn", "sectorId", "sexo", "tamano", "tipo", "vigenteHasta") SELECT "codigo", "colorPrincipal", "creadaEn", "especie", "estado", "fechaEvento", "fotoUrl", "id", "loteDemoId", "moderacion", "personaId", "reencuentroPorCoincidencia", "resguardada", "resueltaEn", "sectorId", "sexo", "tamano", "tipo", "vigenteHasta" FROM "PublicacionMascota";
DROP TABLE "PublicacionMascota";
ALTER TABLE "new_PublicacionMascota" RENAME TO "PublicacionMascota";
CREATE UNIQUE INDEX "PublicacionMascota_codigo_key" ON "PublicacionMascota"("codigo");
CREATE INDEX "PublicacionMascota_tipo_estado_especie_idx" ON "PublicacionMascota"("tipo", "estado", "especie");
CREATE INDEX "PublicacionMascota_loteDemoId_idx" ON "PublicacionMascota"("loteDemoId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

