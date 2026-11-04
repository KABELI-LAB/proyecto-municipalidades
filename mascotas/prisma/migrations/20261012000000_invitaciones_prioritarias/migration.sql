-- CreateTable
CREATE TABLE "InvitacionOperativo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "operativoId" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ENVIADA',
    "orden" INTEGER NOT NULL,
    "venceEn" DATETIME NOT NULL,
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondidaEn" DATETIME,
    "asignadaEn" DATETIME,
    "cerradaEn" DATETIME,
    "motivoCierre" TEXT,
    "cupoId" TEXT,
    "loteDemoId" TEXT,
    CONSTRAINT "InvitacionOperativo_operativoId_fkey" FOREIGN KEY ("operativoId") REFERENCES "Operativo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InvitacionOperativo_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InvitacionOperativo_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "SolicitudServicio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InvitacionOperativo_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InvitacionOperativo_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InvitacionOperativo_cupoId_fkey" FOREIGN KEY ("cupoId") REFERENCES "Cupo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "InvitacionOperativo_codigo_key" ON "InvitacionOperativo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "InvitacionOperativo_cupoId_key" ON "InvitacionOperativo"("cupoId");

-- CreateIndex
CREATE INDEX "InvitacionOperativo_operativoId_servicioId_estado_idx" ON "InvitacionOperativo"("operativoId", "servicioId", "estado");

-- CreateIndex
CREATE INDEX "InvitacionOperativo_estado_venceEn_idx" ON "InvitacionOperativo"("estado", "venceEn");

-- CreateIndex
CREATE UNIQUE INDEX "InvitacionOperativo_operativoId_solicitudId_key" ON "InvitacionOperativo"("operativoId", "solicitudId");

