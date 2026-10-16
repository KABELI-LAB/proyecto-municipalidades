-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PublicacionMascota" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT,
    "tipo" TEXT NOT NULL,
    "animalId" TEXT,
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
    "localidadId" TEXT,
    "lat" REAL,
    "lng" REAL,
    "fechaEvento" DATETIME NOT NULL,
    "resguardada" BOOLEAN,
    "resguardo" TEXT,
    "resguardoLocalidadId" TEXT,
    "resguardoDetalle" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTA',
    "moderacion" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "personaId" TEXT NOT NULL,
    "vigenteHasta" DATETIME NOT NULL,
    "vigenciaPedidaEn" DATETIME,
    "reencuentroPorCoincidencia" BOOLEAN,
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resueltaEn" DATETIME,
    "loteDemoId" TEXT,
    CONSTRAINT "PublicacionMascota_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PublicacionMascota_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PublicacionMascota_localidadId_fkey" FOREIGN KEY ("localidadId") REFERENCES "Localidad" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PublicacionMascota_resguardoLocalidadId_fkey" FOREIGN KEY ("resguardoLocalidadId") REFERENCES "Localidad" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PublicacionMascota_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PublicacionMascota_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PublicacionMascota" ("animalId", "codigo", "collar", "colorCollar", "colorPrincipal", "creadaEn", "especie", "estado", "fechaEvento", "fotoUrl", "id", "lat", "lng", "localidadId", "loteDemoId", "microchip", "moderacion", "nombreAnimal", "personaId", "reencuentroPorCoincidencia", "resguardada", "resueltaEn", "sectorId", "senas", "sexo", "tamano", "tipo", "vigenciaPedidaEn", "vigenteHasta") SELECT "animalId", "codigo", "collar", "colorCollar", "colorPrincipal", "creadaEn", "especie", "estado", "fechaEvento", "fotoUrl", "id", "lat", "lng", "localidadId", "loteDemoId", "microchip", "moderacion", "nombreAnimal", "personaId", "reencuentroPorCoincidencia", "resguardada", "resueltaEn", "sectorId", "senas", "sexo", "tamano", "tipo", "vigenciaPedidaEn", "vigenteHasta" FROM "PublicacionMascota";
DROP TABLE "PublicacionMascota";
ALTER TABLE "new_PublicacionMascota" RENAME TO "PublicacionMascota";
CREATE UNIQUE INDEX "PublicacionMascota_codigo_key" ON "PublicacionMascota"("codigo");
CREATE INDEX "PublicacionMascota_tipo_estado_especie_idx" ON "PublicacionMascota"("tipo", "estado", "especie");
CREATE INDEX "PublicacionMascota_loteDemoId_idx" ON "PublicacionMascota"("loteDemoId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

