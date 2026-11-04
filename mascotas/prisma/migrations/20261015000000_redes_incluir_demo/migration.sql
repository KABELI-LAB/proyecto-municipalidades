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
    "redesAutomaticas" TEXT NOT NULL DEFAULT '',
    "redesIncluirDemo" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Municipio" ("id", "limitePorHogar", "modoRedes", "nombre", "nombreOficial", "pesoDemanda", "pesoNoCubierta", "pesoReportes", "pesoTiempo", "redesAutomaticas", "sitioWeb") SELECT "id", "limitePorHogar", "modoRedes", "nombre", "nombreOficial", "pesoDemanda", "pesoNoCubierta", "pesoReportes", "pesoTiempo", "redesAutomaticas", "sitioWeb" FROM "Municipio";
DROP TABLE "Municipio";
ALTER TABLE "new_Municipio" RENAME TO "Municipio";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

