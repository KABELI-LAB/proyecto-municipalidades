-- CreateTable
CREATE TABLE "CuidadorAutorizado" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "perroId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "autorizadoPorId" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revocadoEn" DATETIME,
    CONSTRAINT "CuidadorAutorizado_perroId_fkey" FOREIGN KEY ("perroId") REFERENCES "PerroComunitario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CuidadorAutorizado_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CuidadorAutorizado_autorizadoPorId_fkey" FOREIGN KEY ("autorizadoPorId") REFERENCES "UsuarioMunicipal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NovedadComunitario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "perroId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "fotoArchivo" TEXT,
    "personaId" TEXT NOT NULL,
    "cuidadorId" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "respuesta" TEXT,
    "revisadaEn" DATETIME,
    "revisadaPorId" TEXT,
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loteDemoId" TEXT,
    CONSTRAINT "NovedadComunitario_perroId_fkey" FOREIGN KEY ("perroId") REFERENCES "PerroComunitario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NovedadComunitario_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NovedadComunitario_cuidadorId_fkey" FOREIGN KEY ("cuidadorId") REFERENCES "CuidadorAutorizado" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "NovedadComunitario_revisadaPorId_fkey" FOREIGN KEY ("revisadaPorId") REFERENCES "UsuarioMunicipal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HistorialComunitario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "perroId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "detalle" TEXT,
    "publico" BOOLEAN NOT NULL DEFAULT false,
    "usuarioId" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HistorialComunitario_perroId_fkey" FOREIGN KEY ("perroId") REFERENCES "PerroComunitario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HistorialComunitario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "UsuarioMunicipal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

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
    CONSTRAINT "PerroComunitario_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PerroComunitario_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PerroComunitario_lugarId_fkey" FOREIGN KEY ("lugarId") REFERENCES "Lugar" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PerroComunitario_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PerroComunitario_fichaRevisadaPorId_fkey" FOREIGN KEY ("fichaRevisadaPorId") REFERENCES "UsuarioMunicipal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PerroComunitario" ("animalId", "apodo", "cuidadores", "fotos", "id", "lat", "lng", "loteDemoId", "lugarId", "necesitaAtencion", "sectorId", "ultimoControl") SELECT "animalId", "apodo", "cuidadores", "fotos", "id", "lat", "lng", "loteDemoId", "lugarId", "necesitaAtencion", "sectorId", "ultimoControl" FROM "PerroComunitario";
DROP TABLE "PerroComunitario";
ALTER TABLE "new_PerroComunitario" RENAME TO "PerroComunitario";
CREATE UNIQUE INDEX "PerroComunitario_animalId_key" ON "PerroComunitario"("animalId");
CREATE INDEX "PerroComunitario_loteDemoId_idx" ON "PerroComunitario"("loteDemoId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CuidadorAutorizado_codigo_key" ON "CuidadorAutorizado"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "CuidadorAutorizado_perroId_personaId_key" ON "CuidadorAutorizado"("perroId", "personaId");

-- CreateIndex
CREATE UNIQUE INDEX "NovedadComunitario_codigo_key" ON "NovedadComunitario"("codigo");

-- CreateIndex
CREATE INDEX "NovedadComunitario_perroId_estado_idx" ON "NovedadComunitario"("perroId", "estado");

-- CreateIndex
CREATE INDEX "HistorialComunitario_perroId_creadoEn_idx" ON "HistorialComunitario"("perroId", "creadoEn");

