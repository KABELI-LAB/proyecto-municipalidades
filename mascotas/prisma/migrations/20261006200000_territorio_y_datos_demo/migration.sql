-- AlterTable
ALTER TABLE "ResultadoOperativo" ADD COLUMN "detallePorServicio" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SectorVecino";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Localidad" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectorId" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "lat" REAL,
    "lng" REAL,
    "estadoCoordenadas" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Localidad_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lugar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectorId" TEXT NOT NULL,
    "localidadId" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "lat" REAL,
    "lng" REAL,
    "estadoCoordenadas" TEXT,
    CONSTRAINT "Lugar_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Lugar_localidadId_fkey" FOREIGN KEY ("localidadId") REFERENCES "Localidad" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TipoReporte" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipioId" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "publico" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "TipoReporte_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ColorCatalogo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipioId" TEXT NOT NULL,
    "especie" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ColorCatalogo_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PerroComunitario" (
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
    CONSTRAINT "PerroComunitario_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PerroComunitario_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PerroComunitario_lugarId_fkey" FOREIGN KEY ("lugarId") REFERENCES "Lugar" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PerroComunitario_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Animal" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "Animal_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Animal_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Animal" ("colorPrincipal", "creadoEn", "edadAproxMeses", "especie", "esterilizado", "id", "loteDemoId", "microchip", "nombre", "personaId", "sexo", "tamano") SELECT "colorPrincipal", "creadoEn", "edadAproxMeses", "especie", "esterilizado", "id", "loteDemoId", "microchip", "nombre", "personaId", "sexo", "tamano" FROM "Animal";
DROP TABLE "Animal";
ALTER TABLE "new_Animal" RENAME TO "Animal";
CREATE INDEX "Animal_loteDemoId_idx" ON "Animal"("loteDemoId");
CREATE TABLE "new_Atencion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operativoId" TEXT,
    "cupoId" TEXT,
    "animalId" TEXT,
    "servicioId" TEXT NOT NULL,
    "especie" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "lugarId" TEXT,
    "resultado" TEXT NOT NULL DEFAULT 'REALIZADA',
    "observaciones" TEXT,
    "funcionarioId" TEXT,
    "realizadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loteDemoId" TEXT,
    CONSTRAINT "Atencion_operativoId_fkey" FOREIGN KEY ("operativoId") REFERENCES "Operativo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Atencion_cupoId_fkey" FOREIGN KEY ("cupoId") REFERENCES "Cupo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Atencion_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Atencion_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Atencion_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Atencion_lugarId_fkey" FOREIGN KEY ("lugarId") REFERENCES "Lugar" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Atencion_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "UsuarioMunicipal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Atencion_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Atencion" ("animalId", "cupoId", "funcionarioId", "id", "loteDemoId", "observaciones", "operativoId", "realizadaEn", "resultado", "servicioId") SELECT "animalId", "cupoId", "funcionarioId", "id", "loteDemoId", "observaciones", "operativoId", "realizadaEn", "resultado", "servicioId" FROM "Atencion";
DROP TABLE "Atencion";
ALTER TABLE "new_Atencion" RENAME TO "Atencion";
CREATE UNIQUE INDEX "Atencion_cupoId_key" ON "Atencion"("cupoId");
CREATE INDEX "Atencion_operativoId_idx" ON "Atencion"("operativoId");
CREATE INDEX "Atencion_sectorId_realizadaEn_idx" ON "Atencion"("sectorId", "realizadaEn");
CREATE INDEX "Atencion_loteDemoId_idx" ON "Atencion"("loteDemoId");
CREATE TABLE "new_FichaAdopcion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "animalId" TEXT NOT NULL,
    "caracter" TEXT NOT NULL,
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
INSERT INTO "new_FichaAdopcion" ("adoptadaEn", "adoptanteId", "animalId", "caracter", "estado", "id", "loteDemoId", "publicadaEn", "sectorAdoptanteId") SELECT "adoptadaEn", "adoptanteId", "animalId", "caracter", "estado", "id", "loteDemoId", "publicadaEn", "sectorAdoptanteId" FROM "FichaAdopcion";
DROP TABLE "FichaAdopcion";
ALTER TABLE "new_FichaAdopcion" RENAME TO "FichaAdopcion";
CREATE UNIQUE INDEX "FichaAdopcion_animalId_key" ON "FichaAdopcion"("animalId");
CREATE INDEX "FichaAdopcion_loteDemoId_idx" ON "FichaAdopcion"("loteDemoId");
CREATE TABLE "new_LoteDemo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descripcion" TEXT NOT NULL,
    "fechaCorte" DATETIME,
    "desfaseDias" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_LoteDemo" ("creadoEn", "descripcion", "id") SELECT "creadoEn", "descripcion", "id" FROM "LoteDemo";
DROP TABLE "LoteDemo";
ALTER TABLE "new_LoteDemo" RENAME TO "LoteDemo";
CREATE TABLE "new_Operativo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT,
    "sectorId" TEXT NOT NULL,
    "lugarId" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "requisitos" TEXT NOT NULL DEFAULT '',
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "origen" TEXT NOT NULL DEFAULT 'DESDE_CERO',
    "fotos" TEXT NOT NULL DEFAULT '',
    "creadoPorId" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publicadoEn" DATETIME,
    "cerradoEn" DATETIME,
    "loteDemoId" TEXT,
    CONSTRAINT "Operativo_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Operativo_lugarId_fkey" FOREIGN KEY ("lugarId") REFERENCES "Lugar" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Operativo_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "UsuarioMunicipal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Operativo_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Operativo" ("cerradoEn", "creadoEn", "creadoPorId", "estado", "fecha", "horaFin", "horaInicio", "id", "loteDemoId", "origen", "publicadoEn", "requisitos", "sectorId") SELECT "cerradoEn", "creadoEn", "creadoPorId", "estado", "fecha", "horaFin", "horaInicio", "id", "loteDemoId", "origen", "publicadoEn", "requisitos", "sectorId" FROM "Operativo";
DROP TABLE "Operativo";
ALTER TABLE "new_Operativo" RENAME TO "Operativo";
CREATE INDEX "Operativo_sectorId_estado_idx" ON "Operativo"("sectorId", "estado");
CREATE INDEX "Operativo_loteDemoId_idx" ON "Operativo"("loteDemoId");
CREATE TABLE "new_Persona" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipioId" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
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
INSERT INTO "new_Persona" ("correo", "creadaEn", "id", "loteDemoId", "municipioId", "nombre", "rut", "sectorId", "telefono") SELECT "correo", "creadaEn", "id", "loteDemoId", "municipioId", "nombre", "rut", "sectorId", "telefono" FROM "Persona";
DROP TABLE "Persona";
ALTER TABLE "new_Persona" RENAME TO "Persona";
CREATE INDEX "Persona_loteDemoId_idx" ON "Persona"("loteDemoId");
CREATE UNIQUE INDEX "Persona_municipioId_rut_key" ON "Persona"("municipioId", "rut");
CREATE TABLE "new_PostulacionAdopcion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "fichaId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "tipoVivienda" TEXT NOT NULL,
    "experienciaPrevia" BOOLEAN NOT NULL,
    "otrosAnimales" BOOLEAN NOT NULL,
    "otrosAnimalesDetalle" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'EN_EVALUACION',
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loteDemoId" TEXT,
    CONSTRAINT "PostulacionAdopcion_fichaId_fkey" FOREIGN KEY ("fichaId") REFERENCES "FichaAdopcion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PostulacionAdopcion_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PostulacionAdopcion_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PostulacionAdopcion" ("codigo", "creadaEn", "estado", "fichaId", "id", "loteDemoId", "otrosAnimales", "personaId", "tipoVivienda") SELECT "codigo", "creadaEn", "estado", "fichaId", "id", "loteDemoId", "otrosAnimales", "personaId", "tipoVivienda" FROM "PostulacionAdopcion";
DROP TABLE "PostulacionAdopcion";
ALTER TABLE "new_PostulacionAdopcion" RENAME TO "PostulacionAdopcion";
CREATE UNIQUE INDEX "PostulacionAdopcion_codigo_key" ON "PostulacionAdopcion"("codigo");
CREATE INDEX "PostulacionAdopcion_loteDemoId_idx" ON "PostulacionAdopcion"("loteDemoId");
CREATE TABLE "new_PublicacionMascota" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
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
INSERT INTO "new_PublicacionMascota" ("codigo", "collar", "colorCollar", "colorPrincipal", "creadaEn", "especie", "estado", "fechaEvento", "fotoUrl", "id", "loteDemoId", "microchip", "moderacion", "nombreAnimal", "personaId", "reencuentroPorCoincidencia", "resguardada", "resueltaEn", "sectorId", "senas", "sexo", "tamano", "tipo", "vigenteHasta") SELECT "codigo", "collar", "colorCollar", "colorPrincipal", "creadaEn", "especie", "estado", "fechaEvento", "fotoUrl", "id", "loteDemoId", "microchip", "moderacion", "nombreAnimal", "personaId", "reencuentroPorCoincidencia", "resguardada", "resueltaEn", "sectorId", "senas", "sexo", "tamano", "tipo", "vigenteHasta" FROM "PublicacionMascota";
DROP TABLE "PublicacionMascota";
ALTER TABLE "new_PublicacionMascota" RENAME TO "PublicacionMascota";
CREATE UNIQUE INDEX "PublicacionMascota_codigo_key" ON "PublicacionMascota"("codigo");
CREATE INDEX "PublicacionMascota_tipo_estado_especie_idx" ON "PublicacionMascota"("tipo", "estado", "especie");
CREATE INDEX "PublicacionMascota_loteDemoId_idx" ON "PublicacionMascota"("loteDemoId");
CREATE TABLE "new_ReporteCiudadano" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
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
INSERT INTO "new_ReporteCiudadano" ("cantidad", "cerradoEn", "codigo", "creadoEn", "descripcion", "especie", "estado", "id", "loteDemoId", "personaId", "sectorId", "sigueEnLugar") SELECT "cantidad", "cerradoEn", "codigo", "creadoEn", "descripcion", "especie", "estado", "id", "loteDemoId", "personaId", "sectorId", "sigueEnLugar" FROM "ReporteCiudadano";
DROP TABLE "ReporteCiudadano";
ALTER TABLE "new_ReporteCiudadano" RENAME TO "ReporteCiudadano";
CREATE UNIQUE INDEX "ReporteCiudadano_codigo_key" ON "ReporteCiudadano"("codigo");
CREATE INDEX "ReporteCiudadano_sectorId_creadoEn_idx" ON "ReporteCiudadano"("sectorId", "creadoEn");
CREATE INDEX "ReporteCiudadano_loteDemoId_idx" ON "ReporteCiudadano"("loteDemoId");
CREATE TABLE "new_Sector" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipioId" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "centroLat" REAL,
    "centroLng" REAL,
    "estadoCoordenadas" TEXT,
    "viviendas" INTEGER,
    "poblacion" INTEGER,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Sector_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Sector" ("clave", "id", "municipioId", "nombre", "orden", "poblacion", "tipo", "viviendas") SELECT "clave", "id", "municipioId", "nombre", "orden", "poblacion", "tipo", "viviendas" FROM "Sector";
DROP TABLE "Sector";
ALTER TABLE "new_Sector" RENAME TO "Sector";
CREATE UNIQUE INDEX "Sector_municipioId_clave_key" ON "Sector"("municipioId", "clave");
CREATE TABLE "new_SolicitudServicio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "localidadId" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'RECIBIDA',
    "origen" TEXT NOT NULL DEFAULT 'PORTAL',
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" DATETIME NOT NULL,
    "loteDemoId" TEXT,
    CONSTRAINT "SolicitudServicio_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SolicitudServicio_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SolicitudServicio_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SolicitudServicio_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SolicitudServicio_localidadId_fkey" FOREIGN KEY ("localidadId") REFERENCES "Localidad" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SolicitudServicio_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SolicitudServicio" ("actualizadaEn", "animalId", "codigo", "creadaEn", "estado", "id", "loteDemoId", "origen", "personaId", "sectorId", "servicioId") SELECT "actualizadaEn", "animalId", "codigo", "creadaEn", "estado", "id", "loteDemoId", "origen", "personaId", "sectorId", "servicioId" FROM "SolicitudServicio";
DROP TABLE "SolicitudServicio";
ALTER TABLE "new_SolicitudServicio" RENAME TO "SolicitudServicio";
CREATE UNIQUE INDEX "SolicitudServicio_codigo_key" ON "SolicitudServicio"("codigo");
CREATE INDEX "SolicitudServicio_sectorId_estado_idx" ON "SolicitudServicio"("sectorId", "estado");
CREATE INDEX "SolicitudServicio_loteDemoId_idx" ON "SolicitudServicio"("loteDemoId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Localidad_clave_key" ON "Localidad"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "Lugar_clave_key" ON "Lugar"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "TipoReporte_municipioId_clave_key" ON "TipoReporte"("municipioId", "clave");

-- CreateIndex
CREATE UNIQUE INDEX "ColorCatalogo_municipioId_especie_nombre_key" ON "ColorCatalogo"("municipioId", "especie", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "PerroComunitario_animalId_key" ON "PerroComunitario"("animalId");

-- CreateIndex
CREATE INDEX "PerroComunitario_loteDemoId_idx" ON "PerroComunitario"("loteDemoId");

