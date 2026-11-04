// Base SQLite temporal con todas las migraciones del proyecto, para pruebas.
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client";

export async function crearBaseTemporal() {
  const carpeta = mkdtempSync(join(tmpdir(), "tenencia-prueba-"));
  const url = `file:${join(carpeta, "prueba.db").split("\\").join("/")}`;
  const cliente = createClient({ url });
  const migraciones = join(process.cwd(), "prisma", "migrations");
  for (const m of readdirSync(migraciones).filter((d) => /^\d{14}_/.test(d)).sort()) {
    await cliente.executeMultiple(readFileSync(join(migraciones, m, "migration.sql"), "utf8"));
  }
  cliente.close();
  return {
    url,
    /** En Windows el archivo puede seguir bloqueado hasta que termina el proceso: es temporal. */
    borrar: () => {
      try {
        rmSync(carpeta, { recursive: true, force: true });
      } catch {}
    },
  };
}
