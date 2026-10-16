-- AlterTable
ALTER TABLE "Notificacion" ADD COLUMN "enviadaEn" DATETIME;
ALTER TABLE "Notificacion" ADD COLUMN "error" TEXT;

-- CreateTable
CREATE TABLE "CodigoAcceso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personaId" TEXT NOT NULL,
    "huella" TEXT NOT NULL,
    "venceEn" DATETIME NOT NULL,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "usadoEn" DATETIME,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CodigoAcceso_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CodigoAcceso_personaId_idx" ON "CodigoAcceso"("personaId");

