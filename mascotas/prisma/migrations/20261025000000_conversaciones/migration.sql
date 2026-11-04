-- Conversaciones protegidas (reemplazan los mensajes sueltos; producción no tenía mensajes).
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "MensajeProtegido";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Conversacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicacionId" TEXT,
    "fichaId" TEXT,
    "interesadoNombre" TEXT NOT NULL,
    "interesadoCorreo" TEXT NOT NULL,
    "interesadoTelefono" TEXT,
    "duenoComparte" BOOLEAN NOT NULL DEFAULT false,
    "interesadoComparte" BOOLEAN NOT NULL DEFAULT false,
    "creadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Conversacion_publicacionId_fkey" FOREIGN KEY ("publicacionId") REFERENCES "PublicacionMascota" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Conversacion_fichaId_fkey" FOREIGN KEY ("fichaId") REFERENCES "FichaAdopcion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MensajeConversacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversacionId" TEXT NOT NULL,
    "deDueno" BOOLEAN NOT NULL,
    "texto" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MensajeConversacion_conversacionId_fkey" FOREIGN KEY ("conversacionId") REFERENCES "Conversacion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Conversacion_publicacionId_interesadoCorreo_key" ON "Conversacion"("publicacionId", "interesadoCorreo");

-- CreateIndex
CREATE UNIQUE INDEX "Conversacion_fichaId_interesadoCorreo_key" ON "Conversacion"("fichaId", "interesadoCorreo");

-- CreateIndex
CREATE INDEX "MensajeConversacion_conversacionId_creadoEn_idx" ON "MensajeConversacion"("conversacionId", "creadoEn");

