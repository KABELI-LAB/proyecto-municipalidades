-- Mensajes protegidos también sobre fichas de adopción de vecinos (publicación o ficha).
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MensajeProtegido" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicacionId" TEXT,
    "fichaId" TEXT,
    "remitenteNombre" TEXT NOT NULL,
    "remitenteContacto" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respuesta" TEXT,
    "respondidoEn" DATETIME,
    CONSTRAINT "MensajeProtegido_publicacionId_fkey" FOREIGN KEY ("publicacionId") REFERENCES "PublicacionMascota" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MensajeProtegido_fichaId_fkey" FOREIGN KEY ("fichaId") REFERENCES "FichaAdopcion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MensajeProtegido" ("creadoEn", "id", "publicacionId", "remitenteContacto", "remitenteNombre", "respondidoEn", "respuesta", "texto") SELECT "creadoEn", "id", "publicacionId", "remitenteContacto", "remitenteNombre", "respondidoEn", "respuesta", "texto" FROM "MensajeProtegido";
DROP TABLE "MensajeProtegido";
ALTER TABLE "new_MensajeProtegido" RENAME TO "MensajeProtegido";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

