-- Varios municipios en un sitio: cada tabla que no llegaba al municipio por un
-- sector o una persona lo guarda ahora. Los registros existentes toman el de su
-- sector, persona u operativo; si no tienen, el del municipio ya cargado.
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Animal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipioId" TEXT NOT NULL,
    "especie" TEXT NOT NULL,
    "nombre" TEXT,
    "sexo" TEXT NOT NULL DEFAULT 'DESCONOCIDO',
    "edadAproxMeses" INTEGER,
    "colorPrincipal" TEXT,
    "tamano" TEXT,
    "rasgos" TEXT,
    "esterilizado" BOOLEAN,
    "vacunasAlDia" BOOLEAN,
    "microchip" BOOLEAN,
    "foto" TEXT,
    "personaId" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loteDemoId" TEXT,
    CONSTRAINT "Animal_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Animal_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Animal_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Animal" ("colorPrincipal", "creadoEn", "edadAproxMeses", "especie", "esterilizado", "foto", "id", "loteDemoId", "microchip", "nombre", "personaId", "rasgos", "sexo", "tamano", "vacunasAlDia", "municipioId") SELECT "colorPrincipal", "creadoEn", "edadAproxMeses", "especie", "esterilizado", "foto", "id", "loteDemoId", "microchip", "nombre", "personaId", "rasgos", "sexo", "tamano", "vacunasAlDia", COALESCE((SELECT "municipioId" FROM "Persona" WHERE "Persona"."id" = "Animal"."personaId"), (SELECT "id" FROM "Municipio" ORDER BY "id" LIMIT 1)) FROM "Animal";
DROP TABLE "Animal";
ALTER TABLE "new_Animal" RENAME TO "Animal";
CREATE INDEX "Animal_loteDemoId_idx" ON "Animal"("loteDemoId");
CREATE INDEX "Animal_municipioId_idx" ON "Animal"("municipioId");
CREATE TABLE "new_Aviso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "vigenteDesde" DATETIME NOT NULL,
    "vigenteHasta" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "operativoId" TEXT,
    "alertaMes" TEXT,
    "autorId" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loteDemoId" TEXT,
    CONSTRAINT "Aviso_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Aviso_operativoId_fkey" FOREIGN KEY ("operativoId") REFERENCES "Operativo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Aviso_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "UsuarioMunicipal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Aviso_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Aviso" ("alertaMes", "autorId", "creadoEn", "destacado", "estado", "id", "loteDemoId", "operativoId", "texto", "tipo", "titulo", "vigenteDesde", "vigenteHasta", "municipioId") SELECT "alertaMes", "autorId", "creadoEn", "destacado", "estado", "id", "loteDemoId", "operativoId", "texto", "tipo", "titulo", "vigenteDesde", "vigenteHasta", COALESCE((SELECT "Sector"."municipioId" FROM "AvisoSector" JOIN "Sector" ON "Sector"."id" = "AvisoSector"."sectorId" WHERE "AvisoSector"."avisoId" = "Aviso"."id" LIMIT 1), (SELECT "Sector"."municipioId" FROM "Operativo" JOIN "Sector" ON "Sector"."id" = "Operativo"."sectorId" WHERE "Operativo"."id" = "Aviso"."operativoId"), (SELECT "municipioId" FROM "UsuarioMunicipal" WHERE "UsuarioMunicipal"."id" = "Aviso"."autorId"), (SELECT "id" FROM "Municipio" ORDER BY "id" LIMIT 1)) FROM "Aviso";
DROP TABLE "Aviso";
ALTER TABLE "new_Aviso" RENAME TO "Aviso";
CREATE INDEX "Aviso_estado_vigenteHasta_idx" ON "Aviso"("estado", "vigenteHasta");
CREATE INDEX "Aviso_loteDemoId_idx" ON "Aviso"("loteDemoId");
CREATE INDEX "Aviso_municipioId_idx" ON "Aviso"("municipioId");
CREATE TABLE "new_FichaAdopcion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipioId" TEXT NOT NULL,
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
    CONSTRAINT "FichaAdopcion_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FichaAdopcion_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FichaAdopcion_adoptanteId_fkey" FOREIGN KEY ("adoptanteId") REFERENCES "Persona" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FichaAdopcion_sectorAdoptanteId_fkey" FOREIGN KEY ("sectorAdoptanteId") REFERENCES "Sector" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FichaAdopcion_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FichaAdopcion_proponenteId_fkey" FOREIGN KEY ("proponenteId") REFERENCES "Persona" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FichaAdopcion_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FichaAdopcion_localidadId_fkey" FOREIGN KEY ("localidadId") REFERENCES "Localidad" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FichaAdopcion_revisadoPorId_fkey" FOREIGN KEY ("revisadoPorId") REFERENCES "UsuarioMunicipal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_FichaAdopcion" ("adoptadaEn", "adoptanteId", "animalId", "autorizaPublicar", "caracter", "cierre", "codigo", "conviveConAnimales", "conviveConNinos", "creadaEn", "estado", "fotos", "hogarTexto", "huellasFotos", "id", "localidadId", "loteDemoId", "motivoRevision", "proponenteId", "publicadaEn", "relacion", "revisadaEn", "revisadoPorId", "revision", "saludTexto", "sectorAdoptanteId", "sectorId", "municipioId") SELECT "adoptadaEn", "adoptanteId", "animalId", "autorizaPublicar", "caracter", "cierre", "codigo", "conviveConAnimales", "conviveConNinos", "creadaEn", "estado", "fotos", "hogarTexto", "huellasFotos", "id", "localidadId", "loteDemoId", "motivoRevision", "proponenteId", "publicadaEn", "relacion", "revisadaEn", "revisadoPorId", "revision", "saludTexto", "sectorAdoptanteId", "sectorId", COALESCE((SELECT "municipioId" FROM "Sector" WHERE "Sector"."id" = "FichaAdopcion"."sectorId"), (SELECT "municipioId" FROM "Persona" WHERE "Persona"."id" = "FichaAdopcion"."proponenteId"), (SELECT "Persona"."municipioId" FROM "Animal" JOIN "Persona" ON "Persona"."id" = "Animal"."personaId" WHERE "Animal"."id" = "FichaAdopcion"."animalId"), (SELECT "id" FROM "Municipio" ORDER BY "id" LIMIT 1)) FROM "FichaAdopcion";
DROP TABLE "FichaAdopcion";
ALTER TABLE "new_FichaAdopcion" RENAME TO "FichaAdopcion";
CREATE UNIQUE INDEX "FichaAdopcion_animalId_key" ON "FichaAdopcion"("animalId");
CREATE UNIQUE INDEX "FichaAdopcion_codigo_key" ON "FichaAdopcion"("codigo");
CREATE INDEX "FichaAdopcion_loteDemoId_idx" ON "FichaAdopcion"("loteDemoId");
CREATE INDEX "FichaAdopcion_revision_idx" ON "FichaAdopcion"("revision");
CREATE INDEX "FichaAdopcion_municipioId_idx" ON "FichaAdopcion"("municipioId");
CREATE TABLE "new_Localidad" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipioId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "lat" REAL,
    "lng" REAL,
    "estadoCoordenadas" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Localidad_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Localidad_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Localidad" ("clave", "estadoCoordenadas", "id", "lat", "lng", "nombre", "orden", "sectorId", "municipioId") SELECT "clave", "estadoCoordenadas", "id", "lat", "lng", "nombre", "orden", "sectorId", (SELECT "municipioId" FROM "Sector" WHERE "Sector"."id" = "Localidad"."sectorId") FROM "Localidad";
DROP TABLE "Localidad";
ALTER TABLE "new_Localidad" RENAME TO "Localidad";
CREATE UNIQUE INDEX "Localidad_municipioId_clave_key" ON "Localidad"("municipioId", "clave");
CREATE TABLE "new_LoteDemo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipioId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fechaCorte" DATETIME,
    "desfaseDias" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoteDemo_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LoteDemo" ("creadoEn", "descripcion", "desfaseDias", "fechaCorte", "id", "municipioId") SELECT "creadoEn", "descripcion", "desfaseDias", "fechaCorte", "id", (SELECT "id" FROM "Municipio" ORDER BY "id" LIMIT 1) FROM "LoteDemo";
DROP TABLE "LoteDemo";
ALTER TABLE "new_LoteDemo" RENAME TO "LoteDemo";
CREATE INDEX "LoteDemo_municipioId_idx" ON "LoteDemo"("municipioId");
CREATE TABLE "new_Lugar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipioId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "localidadId" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "lat" REAL,
    "lng" REAL,
    "estadoCoordenadas" TEXT,
    CONSTRAINT "Lugar_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Lugar_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Lugar_localidadId_fkey" FOREIGN KEY ("localidadId") REFERENCES "Localidad" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Lugar" ("clave", "estadoCoordenadas", "id", "lat", "lng", "localidadId", "nombre", "sectorId", "tipo", "municipioId") SELECT "clave", "estadoCoordenadas", "id", "lat", "lng", "localidadId", "nombre", "sectorId", "tipo", (SELECT "municipioId" FROM "Sector" WHERE "Sector"."id" = "Lugar"."sectorId") FROM "Lugar";
DROP TABLE "Lugar";
ALTER TABLE "new_Lugar" RENAME TO "Lugar";
CREATE UNIQUE INDEX "Lugar_municipioId_clave_key" ON "Lugar"("municipioId", "clave");
CREATE TABLE "new_Notificacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipioId" TEXT NOT NULL,
    "destinatario" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'SIMULADA',
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enviadaEn" DATETIME,
    "error" TEXT,
    "loteDemoId" TEXT,
    CONSTRAINT "Notificacion_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Notificacion_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Notificacion" ("asunto", "canal", "contenido", "creadaEn", "destinatario", "enviadaEn", "error", "estado", "id", "loteDemoId", "municipioId") SELECT "asunto", "canal", "contenido", "creadaEn", "destinatario", "enviadaEn", "error", "estado", "id", "loteDemoId", (SELECT "id" FROM "Municipio" ORDER BY "id" LIMIT 1) FROM "Notificacion";
DROP TABLE "Notificacion";
ALTER TABLE "new_Notificacion" RENAME TO "Notificacion";
CREATE INDEX "Notificacion_loteDemoId_idx" ON "Notificacion"("loteDemoId");
CREATE INDEX "Notificacion_municipioId_idx" ON "Notificacion"("municipioId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

