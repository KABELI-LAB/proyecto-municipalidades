-- CreateTable
CREATE TABLE "PublicacionRed" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "origenId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "texto" TEXT NOT NULL,
    "textoGenerado" TEXT NOT NULL,
    "textoAlternativo" TEXT NOT NULL,
    "imagen" TEXT NOT NULL,
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" DATETIME NOT NULL,
    "revisadoPorId" TEXT,
    "aprobadaEn" DATETIME,
    "aprobadaAutomaticamente" BOOLEAN NOT NULL DEFAULT false,
    "publicadaEn" DATETIME,
    "contenedorId" TEXT,
    "igMediaId" TEXT,
    "igPermalink" TEXT,
    "error" TEXT,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "loteDemoId" TEXT,
    CONSTRAINT "PublicacionRed_revisadoPorId_fkey" FOREIGN KEY ("revisadoPorId") REFERENCES "UsuarioMunicipal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PublicacionRed_loteDemoId_fkey" FOREIGN KEY ("loteDemoId") REFERENCES "LoteDemo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventoPublicacionRed" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicacionId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "detalle" TEXT,
    "usuarioId" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventoPublicacionRed_publicacionId_fkey" FOREIGN KEY ("publicacionId") REFERENCES "PublicacionRed" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventoPublicacionRed_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "UsuarioMunicipal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Municipio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "nombreOficial" TEXT NOT NULL,
    "sitioWeb" TEXT,
    "pesoDemanda" REAL NOT NULL DEFAULT 0.4,
    "pesoReportes" REAL NOT NULL DEFAULT 0.25,
    "pesoTiempo" REAL NOT NULL DEFAULT 0.2,
    "pesoNoCubierta" REAL NOT NULL DEFAULT 0.15,
    "limitePorHogar" INTEGER NOT NULL DEFAULT 2,
    "modoRedes" TEXT NOT NULL DEFAULT 'REVISION',
    "redesAutomaticas" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_Municipio" ("id", "limitePorHogar", "nombre", "nombreOficial", "pesoDemanda", "pesoNoCubierta", "pesoReportes", "pesoTiempo", "sitioWeb") SELECT "id", "limitePorHogar", "nombre", "nombreOficial", "pesoDemanda", "pesoNoCubierta", "pesoReportes", "pesoTiempo", "sitioWeb" FROM "Municipio";
DROP TABLE "Municipio";
ALTER TABLE "new_Municipio" RENAME TO "Municipio";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PublicacionRed_estado_idx" ON "PublicacionRed"("estado");

-- CreateIndex
CREATE INDEX "PublicacionRed_loteDemoId_idx" ON "PublicacionRed"("loteDemoId");

-- CreateIndex
CREATE UNIQUE INDEX "PublicacionRed_tipo_origenId_version_key" ON "PublicacionRed"("tipo", "origenId", "version");

-- CreateIndex
CREATE INDEX "EventoPublicacionRed_publicacionId_idx" ON "EventoPublicacionRed"("publicacionId");

