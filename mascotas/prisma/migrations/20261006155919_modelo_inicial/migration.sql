-- CreateTable
CREATE TABLE "Municipio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "nombreOficial" TEXT NOT NULL,
    "sitioWeb" TEXT,
    "pesoDemanda" REAL NOT NULL DEFAULT 0.4,
    "pesoReportes" REAL NOT NULL DEFAULT 0.25,
    "pesoTiempo" REAL NOT NULL DEFAULT 0.2,
    "pesoNoCubierta" REAL NOT NULL DEFAULT 0.15,
    "limitePorHogar" INTEGER NOT NULL DEFAULT 2
);

-- CreateTable
CREATE TABLE "Sector" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipioId" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "zonaAproximada" TEXT,
    "viviendas" INTEGER,
    "poblacion" INTEGER,
    "aproximado" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Sector_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SectorVecino" (
    "sectorAId" TEXT NOT NULL,
    "sectorBId" TEXT NOT NULL,

    PRIMARY KEY ("sectorAId", "sectorBId"),
    CONSTRAINT "SectorVecino_sectorAId_fkey" FOREIGN KEY ("sectorAId") REFERENCES "Sector" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SectorVecino_sectorBId_fkey" FOREIGN KEY ("sectorBId") REFERENCES "Sector" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Servicio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipioId" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Servicio_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UsuarioMunicipal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "hashContrasena" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "loteDemoId" TEXT,
    CONSTRAINT "UsuarioMunicipal_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UsuarioMunicipal_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LoteDemo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descripcion" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Persona" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipioId" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "correo" TEXT,
    "sectorId" TEXT NOT NULL,
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loteDemoId" TEXT,
    CONSTRAINT "Persona_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Persona_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Persona_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Animal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "especie" TEXT NOT NULL,
    "nombre" TEXT,
    "sexo" TEXT NOT NULL DEFAULT 'DESCONOCIDO',
    "edadAproxMeses" INTEGER,
    "colorPrincipal" TEXT,
    "tamano" TEXT,
    "esterilizado" BOOLEAN,
    "vacunaAntirrabica" BOOLEAN,
    "microchip" BOOLEAN,
    "personaId" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loteDemoId" TEXT,
    CONSTRAINT "Animal_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Animal_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SolicitudServicio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'RECIBIDA',
    "origen" TEXT NOT NULL DEFAULT 'PORTAL',
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" DATETIME NOT NULL,
    "loteDemoId" TEXT,
    CONSTRAINT "SolicitudServicio_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SolicitudServicio_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SolicitudServicio_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SolicitudServicio_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SolicitudServicio_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReporteCiudadano" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "especie" TEXT,
    "sectorId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'RECIBIDO',
    "personaId" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerradoEn" DATETIME,
    "loteDemoId" TEXT,
    CONSTRAINT "ReporteCiudadano_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReporteCiudadano_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ReporteCiudadano_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PublicacionMascota" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "especie" TEXT NOT NULL,
    "sexo" TEXT NOT NULL DEFAULT 'DESCONOCIDO',
    "tamano" TEXT,
    "colorPrincipal" TEXT NOT NULL,
    "rasgos" TEXT NOT NULL DEFAULT '',
    "descripcion" TEXT,
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

-- CreateTable
CREATE TABLE "Coincidencia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "perdidaId" TEXT NOT NULL,
    "encontradaId" TEXT NOT NULL,
    "puntaje" REAL NOT NULL,
    "motivos" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'SUGERIDA',
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Coincidencia_perdidaId_fkey" FOREIGN KEY ("perdidaId") REFERENCES "PublicacionMascota" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Coincidencia_encontradaId_fkey" FOREIGN KEY ("encontradaId") REFERENCES "PublicacionMascota" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MensajeProtegido" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicacionId" TEXT NOT NULL,
    "remitenteNombre" TEXT NOT NULL,
    "remitenteContacto" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MensajeProtegido_publicacionId_fkey" FOREIGN KEY ("publicacionId") REFERENCES "PublicacionMascota" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FichaAdopcion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "animalId" TEXT NOT NULL,
    "caracter" TEXT NOT NULL,
    "convivencia" TEXT NOT NULL,
    "fotos" TEXT NOT NULL DEFAULT '',
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

-- CreateTable
CREATE TABLE "PostulacionAdopcion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "fichaId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "tipoVivienda" TEXT NOT NULL,
    "experiencia" TEXT NOT NULL,
    "otrosAnimales" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'EN_EVALUACION',
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loteDemoId" TEXT,
    CONSTRAINT "PostulacionAdopcion_fichaId_fkey" FOREIGN KEY ("fichaId") REFERENCES "FichaAdopcion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PostulacionAdopcion_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PostulacionAdopcion_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Operativo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectorId" TEXT NOT NULL,
    "lugarReferencia" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "requisitos" TEXT NOT NULL DEFAULT '',
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "origen" TEXT NOT NULL DEFAULT 'DESDE_CERO',
    "creadoPorId" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publicadoEn" DATETIME,
    "cerradoEn" DATETIME,
    "loteDemoId" TEXT,
    CONSTRAINT "Operativo_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Operativo_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "UsuarioMunicipal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Operativo_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CapacidadServicio" (
    "operativoId" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,
    "cupos" INTEGER NOT NULL,

    PRIMARY KEY ("operativoId", "servicioId"),
    CONSTRAINT "CapacidadServicio_operativoId_fkey" FOREIGN KEY ("operativoId") REFERENCES "Operativo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CapacidadServicio_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cupo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "operativoId" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "solicitudId" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'CONFIRMADO',
    "posicionEspera" INTEGER,
    "confirmado48h" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loteDemoId" TEXT,
    CONSTRAINT "Cupo_operativoId_fkey" FOREIGN KEY ("operativoId") REFERENCES "Operativo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cupo_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cupo_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cupo_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cupo_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "SolicitudServicio" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Cupo_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Atencion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operativoId" TEXT NOT NULL,
    "cupoId" TEXT,
    "animalId" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,
    "resultado" TEXT NOT NULL DEFAULT 'REALIZADA',
    "observaciones" TEXT,
    "funcionarioId" TEXT,
    "realizadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loteDemoId" TEXT,
    CONSTRAINT "Atencion_operativoId_fkey" FOREIGN KEY ("operativoId") REFERENCES "Operativo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Atencion_cupoId_fkey" FOREIGN KEY ("cupoId") REFERENCES "Cupo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Atencion_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Atencion_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Atencion_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "UsuarioMunicipal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Atencion_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResultadoOperativo" (
    "operativoId" TEXT NOT NULL PRIMARY KEY,
    "inscritos" INTEGER NOT NULL,
    "asistentes" INTEGER NOT NULL,
    "atenciones" INTEGER NOT NULL,
    "atencionesPorServicio" TEXT NOT NULL,
    "demandaNoCubierta" INTEGER NOT NULL,
    "calculadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResultadoOperativo_operativoId_fkey" FOREIGN KEY ("operativoId") REFERENCES "Operativo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AsignacionTerreno" (
    "usuarioId" TEXT NOT NULL,
    "operativoId" TEXT NOT NULL,

    PRIMARY KEY ("usuarioId", "operativoId"),
    CONSTRAINT "AsignacionTerreno_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "UsuarioMunicipal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AsignacionTerreno_operativoId_fkey" FOREIGN KEY ("operativoId") REFERENCES "Operativo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Aviso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "vigenteDesde" DATETIME NOT NULL,
    "vigenteHasta" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "operativoId" TEXT,
    "autorId" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loteDemoId" TEXT,
    CONSTRAINT "Aviso_operativoId_fkey" FOREIGN KEY ("operativoId") REFERENCES "Operativo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Aviso_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "UsuarioMunicipal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Aviso_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AvisoSector" (
    "avisoId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,

    PRIMARY KEY ("avisoId", "sectorId"),
    CONSTRAINT "AvisoSector_avisoId_fkey" FOREIGN KEY ("avisoId") REFERENCES "Aviso" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AvisoSector_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DecisionPrioridad" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectorId" TEXT NOT NULL,
    "puntaje" REAL NOT NULL,
    "nivel" TEXT NOT NULL,
    "motivos" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "usuarioId" TEXT,
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loteDemoId" TEXT,
    CONSTRAINT "DecisionPrioridad_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DecisionPrioridad_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "UsuarioMunicipal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DecisionPrioridad_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "destinatario" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'SIMULADA',
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loteDemoId" TEXT,
    CONSTRAINT "Notificacion_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Sector_municipioId_clave_key" ON "Sector"("municipioId", "clave");

-- CreateIndex
CREATE UNIQUE INDEX "Servicio_municipioId_clave_key" ON "Servicio"("municipioId", "clave");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioMunicipal_correo_key" ON "UsuarioMunicipal"("correo");

-- CreateIndex
CREATE INDEX "UsuarioMunicipal_loteDemoId_idx" ON "UsuarioMunicipal"("loteDemoId");

-- CreateIndex
CREATE INDEX "Persona_loteDemoId_idx" ON "Persona"("loteDemoId");

-- CreateIndex
CREATE UNIQUE INDEX "Persona_municipioId_rut_key" ON "Persona"("municipioId", "rut");

-- CreateIndex
CREATE INDEX "Animal_loteDemoId_idx" ON "Animal"("loteDemoId");

-- CreateIndex
CREATE UNIQUE INDEX "SolicitudServicio_codigo_key" ON "SolicitudServicio"("codigo");

-- CreateIndex
CREATE INDEX "SolicitudServicio_sectorId_estado_idx" ON "SolicitudServicio"("sectorId", "estado");

-- CreateIndex
CREATE INDEX "SolicitudServicio_loteDemoId_idx" ON "SolicitudServicio"("loteDemoId");

-- CreateIndex
CREATE UNIQUE INDEX "ReporteCiudadano_codigo_key" ON "ReporteCiudadano"("codigo");

-- CreateIndex
CREATE INDEX "ReporteCiudadano_sectorId_creadoEn_idx" ON "ReporteCiudadano"("sectorId", "creadoEn");

-- CreateIndex
CREATE INDEX "ReporteCiudadano_loteDemoId_idx" ON "ReporteCiudadano"("loteDemoId");

-- CreateIndex
CREATE UNIQUE INDEX "PublicacionMascota_codigo_key" ON "PublicacionMascota"("codigo");

-- CreateIndex
CREATE INDEX "PublicacionMascota_tipo_estado_especie_idx" ON "PublicacionMascota"("tipo", "estado", "especie");

-- CreateIndex
CREATE INDEX "PublicacionMascota_loteDemoId_idx" ON "PublicacionMascota"("loteDemoId");

-- CreateIndex
CREATE UNIQUE INDEX "Coincidencia_perdidaId_encontradaId_key" ON "Coincidencia"("perdidaId", "encontradaId");

-- CreateIndex
CREATE UNIQUE INDEX "FichaAdopcion_animalId_key" ON "FichaAdopcion"("animalId");

-- CreateIndex
CREATE INDEX "FichaAdopcion_loteDemoId_idx" ON "FichaAdopcion"("loteDemoId");

-- CreateIndex
CREATE UNIQUE INDEX "PostulacionAdopcion_codigo_key" ON "PostulacionAdopcion"("codigo");

-- CreateIndex
CREATE INDEX "PostulacionAdopcion_loteDemoId_idx" ON "PostulacionAdopcion"("loteDemoId");

-- CreateIndex
CREATE INDEX "Operativo_sectorId_estado_idx" ON "Operativo"("sectorId", "estado");

-- CreateIndex
CREATE INDEX "Operativo_loteDemoId_idx" ON "Operativo"("loteDemoId");

-- CreateIndex
CREATE UNIQUE INDEX "Cupo_codigo_key" ON "Cupo"("codigo");

-- CreateIndex
CREATE INDEX "Cupo_operativoId_servicioId_estado_idx" ON "Cupo"("operativoId", "servicioId", "estado");

-- CreateIndex
CREATE INDEX "Cupo_loteDemoId_idx" ON "Cupo"("loteDemoId");

-- CreateIndex
CREATE UNIQUE INDEX "Atencion_cupoId_key" ON "Atencion"("cupoId");

-- CreateIndex
CREATE INDEX "Atencion_operativoId_idx" ON "Atencion"("operativoId");

-- CreateIndex
CREATE INDEX "Atencion_loteDemoId_idx" ON "Atencion"("loteDemoId");

-- CreateIndex
CREATE INDEX "Aviso_estado_vigenteHasta_idx" ON "Aviso"("estado", "vigenteHasta");

-- CreateIndex
CREATE INDEX "Aviso_loteDemoId_idx" ON "Aviso"("loteDemoId");

-- CreateIndex
CREATE INDEX "DecisionPrioridad_loteDemoId_idx" ON "DecisionPrioridad"("loteDemoId");

-- CreateIndex
CREATE INDEX "Notificacion_loteDemoId_idx" ON "Notificacion"("loteDemoId");
