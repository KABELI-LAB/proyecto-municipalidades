// Meses para el mapa del panel (línea de tiempo de 12 meses).

const NOMBRE_MES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** «2026-09» → «septiembre de 2026». */
export const nombreMes = (mes: string) => `${NOMBRE_MES[Number(mes.slice(5, 7)) - 1]} de ${mes.slice(0, 4)}`;

/** Los últimos 12 meses hasta el de `hoy`, del más antiguo al más reciente («2025-11» … «2026-10»). */
export function ultimos12Meses(hoy: string): string[] {
  const anio = Number(hoy.slice(0, 4));
  const mes = Number(hoy.slice(5, 7));
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(anio, mes - 1 - (11 - i), 1));
    return d.toISOString().slice(0, 7);
  });
}

