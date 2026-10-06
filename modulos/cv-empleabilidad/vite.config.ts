/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cvApiDevPlugin } from './server/vitePlugin.ts'

// Un único .env en la raíz del monorepo (ver .env.example).
const envDir = fileURLToPath(new URL('../..', import.meta.url))

export default defineConfig({
  plugins: [react(), cvApiDevPlugin(envDir)],
  envDir,
  // 5173 es del sitio anfitrión; cada módulo usa su propio puerto.
  server: { port: 5174 },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
})
