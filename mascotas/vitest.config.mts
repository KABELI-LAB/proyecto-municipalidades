import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Los módulos de servidor se prueban fuera de Next: "server-only" no aplica aquí.
      "server-only": fileURLToPath(new URL("./src/pruebas/server-only.ts", import.meta.url)),
    },
  },
  test: { include: ["src/**/*.test.ts"] },
});
