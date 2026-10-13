// Piezas del módulo de operativos: la fecha como hoja de calendario, el estado
// de inscripción (color + ícono + texto), los servicios con sus cupos y la
// tarjeta del listado. Solo datos reales del operativo.
import { EnlaceBoton } from "@/componentes/Boton";
import { EtiquetaEstado } from "@/componentes/EtiquetaEstado";
import { Icono, type NombreIcono } from "@/componentes/Icono";
import type { Estado } from "@/dominio/etiquetas";
import { municipioActivo } from "@/lib/municipio";
import { fechaLarga, numero } from "@/servidor/formato";
import estilos from "./operativos.module.css";

type Servicio = { servicioId: string; nombre: string; clave?: string; capacidad: number; disponibles: number };

/** Ícono por servicio (claves del catálogo); otro servicio, el genérico. */
export const ICONO_SERVICIO: Record<string, NombreIcono> = { esterilizacion: "corazon", vacunacion: "servicio", microchip: "documento" };

/** Estado de inscripción según el sistema: abierta, solo lista de espera o cerrada. */
export function estadoInscripcion(o: { inscripcionAbierta: boolean; servicios: Servicio[] }): Estado {
  if (!o.inscripcionAbierta) return { texto: "Inscripciones cerradas", tono: "cerrado" };
  if (o.servicios.every((s) => s.disponibles <= 0)) return { texto: "Sin cupos: lista de espera", tono: "espera" };
  return { texto: "Inscripciones abiertas", tono: "confirmado" };
}

/** «oct · 24 · sábado», como hoja de calendario. */
export function FechaCalendario({ fecha }: { fecha: Date }) {
  const zona = municipioActivo().zonaHoraria;
  const parte = (opciones: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("es-CL", { ...opciones, timeZone: zona }).format(fecha).replace(".", "");
  return (
    <span className={estilos.fecha}>
      <span className="visualmente-oculto">{fechaLarga(fecha)}</span>
      <span className={estilos.mes} aria-hidden="true">
        {parte({ month: "short" })}
      </span>
      <span className={estilos.dia} aria-hidden="true">
        {parte({ day: "numeric" })}
      </span>
      <span className={estilos.semana} aria-hidden="true">
        {parte({ weekday: "long" })}
      </span>
    </span>
  );
}

const cupos = (n: number) => `${numero(n)} ${n === 1 ? "cupo" : "cupos"}`;

/** Servicios del operativo como etiquetas con sus cupos disponibles. */
export function ServiciosOperativo({ servicios, abierta }: { servicios: Servicio[]; abierta: boolean }) {
  return (
    <ul className={estilos.servicios} aria-label="Servicios y cupos">
      {servicios.map((s) => {
        const lleno = s.disponibles <= 0;
        return (
          <li key={s.servicioId} className={`${estilos.servicio} ${lleno ? estilos.servicioLleno : ""}`}>
            <Icono nombre={ICONO_SERVICIO[s.clave ?? ""] ?? "servicio"} tamano={18} />
            <b>{s.nombre}</b>
            {abierta && <span>{lleno ? "lista de espera" : cupos(s.disponibles)}</span>}
          </li>
        );
      })}
    </ul>
  );
}

type Props = {
  operativo: {
    id: string;
    fecha: Date;
    horaInicio: string;
    horaFin: string;
    inscripcionAbierta: boolean;
    lugar: { nombre: string; localidad?: { nombre: string } | null };
    sector: { nombre: string };
    servicios: Servicio[];
  };
};

/** Tarjeta del listado: fecha, estado, horario, lugar, servicios con cupos y la acción que el estado permite. */
export function TarjetaOperativo({ operativo: o }: Props) {
  const estado = estadoInscripcion(o);
  return (
    <article className={estilos.tarjeta} aria-labelledby={`operativo-${o.id}`}>
      <FechaCalendario fecha={o.fecha} />
      <div className={estilos.contenido}>
        <EtiquetaEstado estado={estado} />
        <h2 id={`operativo-${o.id}`}>Operativo en {o.sector.nombre}</h2>
        <ul className={estilos.datos}>
          <li>
            <Icono nombre="reloj" tamano={18} />
            {o.horaInicio} a {o.horaFin} horas
          </li>
          <li>
            <Icono nombre="ubicacion" tamano={18} />
            {o.lugar.nombre}
            {o.lugar.localidad ? `, ${o.lugar.localidad.nombre}` : ""}
          </li>
        </ul>
        <ServiciosOperativo servicios={o.servicios} abierta={o.inscripcionAbierta} />
      </div>
      <div className={estilos.accionTarjeta}>
        <EnlaceBoton href={`/operativos/${o.id}`} variante={o.inscripcionAbierta ? "primario" : "secundario"}>
          {o.inscripcionAbierta ? "Ver operativo e inscribirme" : "Ver operativo"}
        </EnlaceBoton>
      </div>
    </article>
  );
}
