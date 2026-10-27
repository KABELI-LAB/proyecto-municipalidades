/** Ruta base del módulo en el sitio (debe coincidir con `path` en src/index.ts). */
export const BASE = '/emergencia'
export const ruta = (sub = '') => (sub ? `${BASE}/${sub}` : BASE)
