-- Publicación automática en Instagram (configurable desde el panel).
ALTER TABLE "Municipio" ADD COLUMN "redesPublicarAuto" BOOLEAN NOT NULL DEFAULT true;
