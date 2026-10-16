-- AlterTable
ALTER TABLE "ReporteCiudadano" ADD COLUMN "fotoArchivo" TEXT;
ALTER TABLE "ReporteCiudadano" ADD COLUMN "urgencia" TEXT;

-- CreateTable
CREATE TABLE "HistorialReporte" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reporteId" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "usuarioId" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HistorialReporte_reporteId_fkey" FOREIGN KEY ("reporteId") REFERENCES "ReporteCiudadano" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HistorialReporte_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "UsuarioMunicipal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TipoReporte" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipioId" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "publico" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "TipoReporte_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "Municipio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TipoReporte" ("clave", "id", "municipioId", "nombre", "orden", "publico") SELECT "clave", "id", "municipioId", "nombre", "orden", "publico" FROM "TipoReporte";
DROP TABLE "TipoReporte";
ALTER TABLE "new_TipoReporte" RENAME TO "TipoReporte";
CREATE UNIQUE INDEX "TipoReporte_municipioId_clave_key" ON "TipoReporte"("municipioId", "clave");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "HistorialReporte_reporteId_creadoEn_idx" ON "HistorialReporte"("reporteId", "creadoEn");

