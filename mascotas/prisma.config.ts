import { defineConfig } from "prisma/config";

// Prisma 7 no carga .env por sí solo. En Netlify no hay .env: las variables
// vienen del entorno, así que su ausencia no es un error.
try {
  process.loadEnvFile?.();
} catch {
  // sin .env
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL },
});
