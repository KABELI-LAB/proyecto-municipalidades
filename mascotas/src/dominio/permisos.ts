// Qué puede hacer cada rol municipal (docs/concepto.md, sección 2).
// Cada acción del servidor vuelve a comprobar el permiso: el menú no basta.

export type Rol = "TERRENO" | "COORDINADOR" | "COMUNICACIONES" | "DIRECTIVO" | "ADMINISTRADOR";

export const NOMBRE_ROL: Record<Rol, string> = {
  TERRENO: "Funcionario de terreno",
  COORDINADOR: "Coordinación de tenencia responsable",
  COMUNICACIONES: "Comunicaciones y moderación",
  DIRECTIVO: "Directivo",
  ADMINISTRADOR: "Administración",
};

const PERMISOS = {
  /** Situación actual, tendencia y sector prioritario (cifras agregadas). */
  verIndicadores: ["COORDINADOR", "DIRECTIVO", "ADMINISTRADOR"],
  /** Bandeja de pendientes (reportes, publicaciones, coincidencias, postulaciones). */
  verBandeja: ["COORDINADOR", "COMUNICACIONES", "ADMINISTRADOR"],
  /** Sectores, ficha de sector y prioridad: herramienta interna. */
  verSectores: ["COORDINADOR", "DIRECTIVO", "ADMINISTRADOR"],
  /** Lista de operativos, ocupación y resultados agregados. */
  verOperativos: ["COORDINADOR", "DIRECTIVO", "COMUNICACIONES", "ADMINISTRADOR"],
  /** Crear, publicar, invitar, gestionar cupos, cerrar y cancelar. */
  gestionarOperativos: ["COORDINADOR", "ADMINISTRADOR"],
  /** Lista de inscritos con nombres: el directivo no ve datos personales. */
  verInscritos: ["COORDINADOR", "ADMINISTRADOR"],
  /** Marcar un sector como evaluado (decisión auditable). */
  decidirPrioridad: ["COORDINADOR", "ADMINISTRADOR"],
  /** Registrar asistencia y atenciones (terreno, solo en su operativo asignado). */
  registrarAtenciones: ["TERRENO", "COORDINADOR", "ADMINISTRADOR"],
  /** Mapa del panel (incluye el calor de reportes) e Inteligencia: cifras agregadas. */
  verInteligencia: ["COORDINADOR", "DIRECTIVO", "ADMINISTRADOR"],
  /** Proponer un aviso en borrador desde la alerta preventiva. */
  proponerAvisos: ["COORDINADOR", "ADMINISTRADOR"],
  /** Revisar, editar y publicar avisos. */
  gestionarAvisos: ["COORDINADOR", "COMUNICACIONES", "ADMINISTRADOR"],
  /** Bandeja de reportes: contenido y sector, nunca la identidad de quien reporta. */
  verReportes: ["COORDINADOR", "DIRECTIVO", "ADMINISTRADOR"],
  /** Pasar a revisión, cerrar o reabrir un reporte. */
  gestionarReportes: ["COORDINADOR", "ADMINISTRADOR"],
  /** Moderar publicaciones de mascotas y validar coincidencias. */
  moderarPublicaciones: ["COORDINADOR", "COMUNICACIONES", "ADMINISTRADOR"],
  /** Revisar postulaciones de adopción (con datos de contacto) y registrar adopciones. */
  gestionarAdopciones: ["COORDINADOR", "ADMINISTRADOR"],
  /** Ver la configuración y probar el simulador de pesos sin guardar. */
  verConfiguracion: ["COORDINADOR", "DIRECTIVO", "ADMINISTRADOR"],
  /** Guardar la configuración (pesos de priorización). */
  configurar: ["ADMINISTRADOR"],
  /** Instagram: permitir, solo para pruebas, publicar contenido de demostración. */
  configurarRedes: ["ADMINISTRADOR"],
} as const satisfies Record<string, readonly Rol[]>;

export type Permiso = keyof typeof PERMISOS;

export function puede(rol: Rol, permiso: Permiso): boolean {
  return (PERMISOS[permiso] as readonly Rol[]).includes(rol);
}

/** Página de inicio del panel según el rol. */
export function inicioDe(rol: Rol): string {
  return "/panel";
}
