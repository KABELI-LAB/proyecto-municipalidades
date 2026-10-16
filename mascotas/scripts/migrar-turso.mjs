// Aplica las migraciones de prisma/migrations a la base Turso indicada en
// DATABASE_URL (libsql://…) con DATABASE_AUTH_TOKEN. Lleva la cuenta en la
// tabla _migraciones_aplicadas: cada migración se aplica una sola vez y en orden.
// Uso: npm run db:migrar-turso (lee .env; no muestra el token).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
if (!url?.startsWith("libsql://")) {
  console.error("DATABASE_URL debe ser la dirección libsql://… de Turso.");
  process.exit(1);
}
const db = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
await db.execute("CREATE TABLE IF NOT EXISTS _migraciones_aplicadas (nombre TEXT PRIMARY KEY, aplicadaEn TEXT NOT NULL)");
const hechas = new Set((await db.execute("SELECT nombre FROM _migraciones_aplicadas")).rows.map((r) => r.nombre));
const carpeta = join(process.cwd(), "prisma", "migrations");
const pendientes = readdirSync(carpeta, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !hechas.has(d.name))
  .map((d) => d.name)
  .sort();
for (const m of pendientes) {
  await db.executeMultiple(readFileSync(join(carpeta, m, "migration.sql"), "utf8"));
  await db.execute({ sql: "INSERT INTO _migraciones_aplicadas (nombre, aplicadaEn) VALUES (?, ?)", args: [m, new Date().toISOString()] });
  console.log(`Aplicada: ${m}`);
}
console.log(pendientes.length ? `Listo: ${pendientes.length} migraciones aplicadas.` : "La base ya estaba al día.");
