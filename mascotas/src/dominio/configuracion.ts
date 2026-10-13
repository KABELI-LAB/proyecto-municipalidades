// Reglas de Configuración: claves de catálogo y cambios de cuentas municipales.
import type { Rol } from "./permisos";

/** «Desparasitación externa» → «desparasitacion-externa»: clave estable para un servicio nuevo. */
export function claveDesdeNombre(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Largo mínimo de una contraseña nueva. */
export const LARGO_CONTRASENA = 12;

type Cambio = {
  /** La cuenta que se cambia es la de quien está usando el panel. */
  esUnoMismo: boolean;
  rolActual: Rol;
  rolNuevo: Rol;
  activoNuevo: boolean;
  /** Administradores activos hoy, incluida esta cuenta si lo es. */
  administradoresActivos: number;
};

/**
 * Devuelve el motivo por el que no se permite el cambio, o null si se permite.
 * Nadie se desactiva ni se quita el rol a sí mismo, y siempre queda al menos
 * un administrador activo.
 */
export function motivoCambioNoPermitido(c: Cambio): string | null {
  if (c.esUnoMismo && !c.activoNuevo) return "No puede desactivar su propia cuenta.";
  if (c.esUnoMismo && c.rolNuevo !== c.rolActual) return "No puede cambiar su propio rol; pídaselo a otra persona de Administración.";
  const dejaDeSerAdmin = c.rolActual === "ADMINISTRADOR" && (c.rolNuevo !== "ADMINISTRADOR" || !c.activoNuevo);
  if (dejaDeSerAdmin && c.administradoresActivos <= 1) return "Debe quedar al menos una cuenta de Administración activa.";
  return null;
}
