-- Respuestas automáticas en Instagram (comentarios y mensajes).
ALTER TABLE "Municipio" ADD COLUMN "redesResponderAuto" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "InteraccionRed" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipioId" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "igId" TEXT NOT NULL,
    "autorIgId" TEXT NOT NULL,
    "mediaId" TEXT,
    "origenTipo" TEXT,
    "origenId" TEXT,
    "texto" TEXT NOT NULL,
    "intencion" TEXT NOT NULL,
    "respuestaPublica" TEXT,
    "respuestaPrivada" TEXT,
    "estado" TEXT NOT NULL,
    "error" TEXT,
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "InteraccionRed_igId_key" ON "InteraccionRed"("igId");
CREATE INDEX "InteraccionRed_municipioId_creadaEn_idx" ON "InteraccionRed"("municipioId", "creadaEn");
