-- Inteligencia artificial (OpenAI): interruptor, quién clasificó cada interacción y resúmenes del panel.
ALTER TABLE "Municipio" ADD COLUMN "iaActiva" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "InteraccionRed" ADD COLUMN "clasificadoPor" TEXT NOT NULL DEFAULT 'REGLAS';

CREATE TABLE "ResumenIA" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "municipioId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "cifras" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "ResumenIA_municipioId_creadoEn_idx" ON "ResumenIA"("municipioId", "creadoEn");
