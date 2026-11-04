-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PostulacionAdopcion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT,
    "fichaId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "tipoVivienda" TEXT NOT NULL,
    "experienciaPrevia" BOOLEAN NOT NULL,
    "otrosAnimales" BOOLEAN NOT NULL,
    "otrosAnimalesDetalle" TEXT,
    "compartirContacto" BOOLEAN NOT NULL DEFAULT false,
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
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

