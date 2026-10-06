/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cvApiDevPlugin } from '@muni/cv-empleabilidad/vite-plugin'

// Un único .env en la raíz del monorepo (ver .env.example).
const envDir = fileURLToPath(new URL('..', import.meta.url))

export default defineConfig({
  // Endpoints de desarrollo que en producción sirven las funciones de Netlify.
  plugins: [react(), cvApiDevPlugin(envDir)],
  envDir,
  server: { port: 5173 },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
})
