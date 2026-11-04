"use client";
// Grupos de campos que se repiten en varios trámites.
import { EDADES, ESPECIE, ESPECIE_ATENDIDA, SEXO, TAMANO } from "@/dominio/etiquetas";
import { CampoSelect, CampoTexto, type Opcion } from "./Campos";
import estilos from "./formulario.module.css";

/** Sectores con sus localidades: la persona elige la localidad y de ella se deduce el sector. */
export type SectorOpcion = { id: string; nombre: string; localidades: { id: string; nombre: string }[] };

export const opcionesLocalidad = (sectores: SectorOpcion[]): Opcion[] =>
  sectores.flatMap((s) => s.localidades.map((l) => ({ valor: l.id, texto: l.nombre, grupo: `Sector ${s.nombre}` })));

/** «Patacón (sector Patacón)» para el resumen. */
export function nombreLocalidad(sectores: SectorOpcion[], localidadId: string) {
  for (const s of sectores) {
    const l = s.localidades.find((x) => x.id === localidadId);
    if (l) return `${l.nombre} (sector ${s.nombre})`;
  }
  return "";
}

/** Localidad de una lista cerrada, agrupada por sector. Nunca una dirección. */
export function CampoLocalidad({ id = "localidadId", etiqueta, valor, alCambiar, error, sectores, ayuda = "Elige la localidad más cercana. No te pediremos tu dirección." }: { id?: string; etiqueta: string; valor: string; alCambiar: (v: string) => void; error?: string; sectores: SectorOpcion[]; ayuda?: string }) {
  return <CampoSelect id={id} etiqueta={etiqueta} valor={valor} alCambiar={alCambiar} error={error} ayuda={ayuda} opciones={opcionesLocalidad(sectores)} />;
}

type Cambiar = (campo: string, valor: string) => void;
type Props = { valores: Record<string, string | string[]>; errores: Record<string, string>; cambiar: Cambiar };

const v = (valores: Props["valores"], k: string) => (valores[k] as string) ?? "";
const opciones = (mapa: Record<string, string>): Opcion[] => Object.entries(mapa).map(([valor, texto]) => ({ valor, texto }));

export const OPCIONES_ESPECIE = opciones(ESPECIE);
/** Servicios y cupos: los operativos atienden perros y gatos. */
export const OPCIONES_ESPECIE_ATENDIDA = opciones(ESPECIE_ATENDIDA);
export const AYUDA_ESPECIE_ATENDIDA = "Por ahora los operativos atienden solo perros y gatos.";

/** Datos de un animal propio. El tamaño solo se pregunta para perros. */
export function BloqueAnimal({ valores, errores, cambiar }: Props) {
  const perro = v(valores, "especie") === "PERRO";
  return (
    <>
      <CampoTexto id="nombreAnimal" etiqueta="Nombre del animal" opcional valor={v(valores, "nombreAnimal")} alCambiar={(x) => cambiar("nombreAnimal", x)} error={errores.nombreAnimal} maxLength={40} />
      <div className={estilos.fila}>
        <CampoSelect id="sexo" etiqueta="Sexo" valor={v(valores, "sexo")} alCambiar={(x) => cambiar("sexo", x)} error={errores.sexo} opciones={opciones(SEXO)} />
        {perro && (
          <CampoSelect id="tamano" etiqueta="Tamaño" valor={v(valores, "tamano")} alCambiar={(x) => cambiar("tamano", x)} error={errores.tamano} opciones={opciones(TAMANO)} />
        )}
        <CampoSelect id="edad" etiqueta="Edad aproximada" valor={v(valores, "edad")} alCambiar={(x) => cambiar("edad", x)} error={errores.edad} opciones={EDADES.map((e) => ({ valor: e.valor, texto: e.texto }))} />
      </div>
    </>
  );
}

/**
 * `sinLocalidad`: el formulario ya pregunta la localidad en otro lugar (por ejemplo, dónde ocurre un reporte).
 * `rut`: «obligatorio» (cupos, adopción, pérdida), «opcional» (solicitar un servicio) o «no» (SOS, avistamiento, novedad).
 * `correoOpcional`: SOS y novedades, donde basta un teléfono o un correo; en el resto el correo es obligatorio.
 */
export function BloquePersona({ valores, errores, cambiar, sectores, etiquetaLocalidad = "Localidad donde vives", sinLocalidad = false, rut = "obligatorio", correoOpcional = false }: Props & { sectores: SectorOpcion[]; etiquetaLocalidad?: string; sinLocalidad?: boolean; rut?: "obligatorio" | "opcional" | "no"; correoOpcional?: boolean }) {
  return (
    <>
      <CampoTexto id="nombre" etiqueta="Nombre y apellido" valor={v(valores, "nombre")} alCambiar={(x) => cambiar("nombre", x)} error={errores.nombre} autoComplete="name" maxLength={100} />
      {rut !== "no" && (
        <CampoTexto
          id="rut"
          etiqueta={rut === "opcional" ? "RUT (opcional)" : "RUT"}
          valor={v(valores, "rut")}
          alCambiar={(x) => cambiar("rut", x)}
          error={errores.rut}
          ayuda="Por ejemplo, 12.345.678-5."
          maxLength={12}
        />
      )}
      <div className={estilos.fila}>
        <CampoTexto id="correo" etiqueta="Correo" tipo="email" inputMode="email" autoComplete="email" valor={v(valores, "correo")} alCambiar={(x) => cambiar("correo", x)} error={errores.correo} maxLength={120} />
        <CampoTexto id="telefono" etiqueta={correoOpcional ? "Teléfono" : "Teléfono (opcional)"} tipo="tel" inputMode="tel" autoComplete="tel" valor={v(valores, "telefono")} alCambiar={(x) => cambiar("telefono", x)} error={errores.telefono} maxLength={20} />
      </div>
      <p className={estilos.ayuda}>
        {correoOpcional
          ? "Indica al menos un teléfono o un correo. No los mostraremos públicamente."
          : "Te avisaremos por correo, y con él entras a Mis solicitudes. No lo mostraremos públicamente."}
      </p>
      {!sinLocalidad && (
        <CampoLocalidad etiqueta={etiquetaLocalidad} valor={v(valores, "localidadId")} alCambiar={(x) => cambiar("localidadId", x)} error={errores.localidadId} sectores={sectores} />
      )}
    </>
  );
}

/** Filas de resumen de la persona para el paso de confirmación. */
export function filasPersona(valores: Props["valores"], sectores: SectorOpcion[], etiquetaLocalidad = "Localidad"): [string, string][] {
  return [
    ["Nombre", v(valores, "nombre")],
    ...(v(valores, "rut") ? [["RUT", v(valores, "rut")] as [string, string]] : []),
    ["Contacto", [v(valores, "telefono"), v(valores, "correo")].filter(Boolean).join(" · ")],
    [etiquetaLocalidad, nombreLocalidad(sectores, v(valores, "localidadId"))],
  ];
}

export function filasAnimal(valores: Props["valores"]): [string, string][] {
  return [
    ["Especie", ESPECIE[v(valores, "especie")] ?? ""],
    ["Nombre del animal", v(valores, "nombreAnimal")],
    ["Sexo", SEXO[v(valores, "sexo")] ?? ""],
    ...(v(valores, "especie") === "PERRO" ? [["Tamaño", TAMANO[v(valores, "tamano")] ?? ""] as [string, string]] : []),
    ["Edad aproximada", EDADES.find((e) => e.valor === v(valores, "edad"))?.texto ?? ""],
  ];
}

export const CAMPOS_PERSONA = ["nombre", "rut", "telefono", "correo", "localidadId"] as const;
export const CAMPOS_ANIMAL = ["nombreAnimal", "sexo", "tamano", "edad"] as const;
export const PERSONA_VACIA = { nombre: "", rut: "", telefono: "", correo: "", localidadId: "" };
export const ANIMAL_VACIO = { especie: "", nombreAnimal: "", sexo: "", tamano: "", edad: "" };
