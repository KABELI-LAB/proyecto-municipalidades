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
    CONSTRAINT "FichaAdopcion_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FichaAdopcion_adoptanteId_fkey" FOREIGN KEY ("adoptanteId") REFERENCES "Persona" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FichaAdopcion_sectorAdoptanteId_fkey" FOREIGN KEY ("sectorAdoptanteId") REFERENCES "Sector" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FichaAdopcion_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_FichaAdopcion" ("adoptadaEn", "adoptanteId", "animalId", "caracter", "conviveConAnimales", "conviveConNinos", "estado", "id", "loteDemoId", "publicadaEn", "sectorAdoptanteId") SELECT "adoptadaEn", "adoptanteId", "animalId", "caracter", "conviveConAnimales", "conviveConNinos", "estado", "id", "loteDemoId", "publicadaEn", "sectorAdoptanteId" FROM "FichaAdopcion";
DROP TABLE "FichaAdopcion";
ALTER TABLE "new_FichaAdopcion" RENAME TO "FichaAdopcion";
CREATE UNIQUE INDEX "FichaAdopcion_animalId_key" ON "FichaAdopcion"("animalId");
CREATE INDEX "FichaAdopcion_loteDemoId_idx" ON "FichaAdopcion"("loteDemoId");
CREATE TABLE "new_PostulacionAdopcion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT,
    "fichaId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "tipoVivienda" TEXT NOT NULL,
    "experienciaPrevia" BOOLEAN NOT NULL,
    "otrosAnimales" BOOLEAN NOT NULL,
    "otrosAnimalesDetalle" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'RECIBIDA',
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loteDemoId" TEXT,
    CONSTRAINT "PostulacionAdopcion_fichaId_fkey" FOREIGN KEY ("fichaId") REFERENCES "FichaAdopcion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PostulacionAdopcion_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PostulacionAdopcion_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PostulacionAdopcion" ("codigo", "creadaEn", "estado", "experienciaPrevia", "fichaId", "id", "loteDemoId", "otrosAnimales", "otrosAnimalesDetalle", "personaId", "tipoVivienda") SELECT "codigo", "creadaEn", "estado", "experienciaPrevia", "fichaId", "id", "loteDemoId", "otrosAnimales", "otrosAnimalesDetalle", "personaId", "tipoVivienda" FROM "PostulacionAdopcion";
DROP TABLE "PostulacionAdopcion";
ALTER TABLE "new_PostulacionAdopcion" RENAME TO "PostulacionAdopcion";
CREATE UNIQUE INDEX "PostulacionAdopcion_codigo_key" ON "PostulacionAdopcion"("codigo");
CREATE INDEX "PostulacionAdopcion_loteDemoId_idx" ON "PostulacionAdopcion"("loteDemoId");
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
    "estado" TEXT NOT NULL DEFAULT 'ABIERTA',
    "moderacion" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "personaId" TEXT NOT NULL,
    "vigenteHasta" DATETIME NOT NULL,
    "reencuentroPorCoincidencia" BOOLEAN,
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resueltaEn" DATETIME,
    "loteDemoId" TEXT,
    CONSTRAINT "PublicacionMascota_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PublicacionMascota_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PublicacionMascota_localidadId_fkey" FOREIGN KEY ("localidadId") REFERENCES "Localidad" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PublicacionMascota_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PublicacionMascota_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PublicacionMascota" ("animalId", "codigo", "collar", "colorCollar", "colorPrincipal", "creadaEn", "especie", "estado", "fechaEvento", "fotoUrl", "id", "lat", "lng", "localidadId", "loteDemoId", "microchip", "moderacion", "nombreAnimal", "personaId", "reencuentroPorCoincidencia", "resguardada", "resueltaEn", "sectorId", "senas", "sexo", "tamano", "tipo", "vigenteHasta") SELECT "animalId", "codigo", "collar", "colorCollar", "colorPrincipal", "creadaEn", "especie", "estado", "fechaEvento", "fotoUrl", "id", "lat", "lng", "localidadId", "loteDemoId", "microchip", "moderacion", "nombreAnimal", "personaId", "reencuentroPorCoincidencia", "resguardada", "resueltaEn", "sectorId", "senas", "sexo", "tamano", "tipo", "vigenteHasta" FROM "PublicacionMascota";
DROP TABLE "PublicacionMascota";
ALTER TABLE "new_PublicacionMascota" RENAME TO "PublicacionMascota";
CREATE UNIQUE INDEX "PublicacionMascota_codigo_key" ON "PublicacionMascota"("codigo");
CREATE INDEX "PublicacionMascota_tipo_estado_especie_idx" ON "PublicacionMascota"("tipo", "estado", "especie");
CREATE INDEX "PublicacionMascota_loteDemoId_idx" ON "PublicacionMascota"("loteDemoId");
CREATE TABLE "new_ReporteCiudadano" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT,
    "tipoId" TEXT NOT NULL,
    "especie" TEXT,
    "cantidad" TEXT,
    "sigueEnLugar" TEXT,
    "sectorId" TEXT NOT NULL,
    "localidadId" TEXT,
    "lugarId" TEXT,
    "lat" REAL,
    "lng" REAL,
    "descripcion" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTO',
    "personaId" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerradoEn" DATETIME,
    "loteDemoId" TEXT,
    CONSTRAINT "ReporteCiudadano_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "TipoReporte" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReporteCiudadano_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReporteCiudadano_localidadId_fkey" FOREIGN KEY ("localidadId") REFERENCES "Localidad" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ReporteCiudadano_lugarId_fkey" FOREIGN KEY ("lugarId") REFERENCES "Lugar" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ReporteCiudadano_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ReporteCiudadano_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ReporteCiudadano" ("cantidad", "cerradoEn", "codigo", "creadoEn", "descripcion", "especie", "estado", "id", "lat", "lng", "localidadId", "loteDemoId", "lugarId", "personaId", "sectorId", "sigueEnLugar", "tipoId") SELECT "cantidad", "cerradoEn", "codigo", "creadoEn", "descripcion", "especie", "estado", "id", "lat", "lng", "localidadId", "loteDemoId", "lugarId", "personaId", "sectorId", "sigueEnLugar", "tipoId" FROM "ReporteCiudadano";
DROP TABLE "ReporteCiudadano";
ALTER TABLE "new_ReporteCiudadano" RENAME TO "ReporteCiudadano";
CREATE UNIQUE INDEX "ReporteCiudadano_codigo_key" ON "ReporteCiudadano"("codigo");
CREATE INDEX "ReporteCiudadano_sectorId_creadoEn_idx" ON "ReporteCiudadano"("sectorId", "creadoEn");
CREATE INDEX "ReporteCiudadano_loteDemoId_idx" ON "ReporteCiudadano"("loteDemoId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

