import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * En desarrollo, un archivo SQLite (`file:./prisma/dev.db`). Publicado, una
 * base Turso (`libsql://…`) con su token en DATABASE_AUTH_TOKEN.
 */
function crearCliente() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta la variable DATABASE_URL (vea el archivo .env).");
  const authToken = process.env.DATABASE_AUTH_TOKEN || undefined;
  return new PrismaClient({ adapter: new PrismaLibSql({ url, authToken }) });
}

// En desarrollo Next recarga módulos; reutilizamos una sola conexión.
const global_ = globalThis as unknown as { db?: PrismaClient };
export const db = global_.db ?? crearCliente();
if (process.env.NODE_ENV !== "production") global_.db = db;
