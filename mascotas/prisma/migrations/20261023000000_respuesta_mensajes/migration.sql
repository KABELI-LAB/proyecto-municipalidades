-- Respuesta de quien publicó un aviso a un mensaje protegido.
ALTER TABLE "MensajeProtegido" ADD COLUMN "respuesta" TEXT;
ALTER TABLE "MensajeProtegido" ADD COLUMN "respondidoEn" DATETIME;
