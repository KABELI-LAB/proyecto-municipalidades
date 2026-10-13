// Marcas del mapa público: común al servidor (que las arma) y al cliente (que las dibuja).
import type { Punto } from "@/dominio/geo";

/** Radio en píxeles según la cantidad, con un mínimo visible. */
export const radioPara = (n: number, maximo: number) => (n === 0 ? 6 : 9 + 15 * Math.sqrt(n / Math.max(maximo, 1)));

// ───────────── Mapa ciudadano (/mapa) ─────────────

/** Una ficha que se abre desde el mapa: aviso, animal en adopción, operativo o perro comunitario. */
export type ItemMapa = {
  clave: string;
  titulo: string;
  lineas: string[];
  href: string;
  /** Marca con texto, nunca solo color (por ejemplo, «Posible coincidencia»). */
  etiqueta?: string;
  foto?: { src: string; subida: boolean };
};

/**
 * Una marca agrupa todo lo que comparte ubicación aproximada (un sector o un
 * lugar de referencia): así no se superponen marcas en el mismo punto.
 */
export type MarcaCiudadana = {
  clave: string;
  centro: Punto;
  radio: number;
  nivel: 0 | 1 | 2 | 3;
  titulo: string;
  /** Resumen corto para la etiqueta del mapa. */
  detalle: string;
  items: ItemMapa[];
  /** Cifras agregadas (capa de resultados). */
  cifras?: { valor: number; texto: string }[];
  /** Enlace a la lista completa o a una acción (por ejemplo, «Informar una novedad»). */
  enlaces?: { href: string; texto: string; principal?: boolean }[];
};

export type CapaCiudadana = {
  marcas: MarcaCiudadana[];
  /** Qué decir cuando la capa no tiene nada que mostrar. */
  vacio: { texto: string; enlace?: { href: string; texto: string } };
  /** Aclaración bajo el mapa (período, privacidad, lo que no se muestra). */
  nota: string;
};

export const CAPAS_CIUDADANAS = {
  mascotas: { nombre: "Perdidas y avistadas", explica: "Avisos vigentes de mascotas perdidas y avistadas, por sector." },
  adopcion: { nombre: "Adopción", explica: "Animales que buscan hogar, según el sector donde están." },
  operativos: { nombre: "Operativos", explica: "Operativos publicados: fecha, lugar de referencia, servicios y cupos." },
  comunitarios: { nombre: "Perros comunitarios", explica: "Perros comunitarios en su lugar de referencia y su última revisión." },
  resultados: { nombre: "Resultados", explica: "Lo que hizo el programa en cada sector durante los últimos 12 meses." },
} as const;
export type CapaMapaCiudadano = keyof typeof CAPAS_CIUDADANAS;
export const CLAVES_CAPA_CIUDADANA = Object.keys(CAPAS_CIUDADANAS) as CapaMapaCiudadano[];
