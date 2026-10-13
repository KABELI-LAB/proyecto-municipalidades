// Piezas de presentación del panel municipal (componentes de servidor).
import Link from "next/link";
import type { ReactNode } from "react";
import { EnlaceBoton } from "@/componentes/Boton";
import { Cifra } from "@/componentes/Cifra";
import { Icono, type NombreIcono } from "@/componentes/Icono";
import type { Nivel, Prioridad } from "@/dominio/prioridad";
import { numero, porcentaje } from "@/dominio/formato";
import estilos from "./piezas.module.css";
import { MarcarEvaluado } from "./MarcarEvaluado";

// ───────────── Nivel de prioridad: color + texto + ícono ─────────────

const NIVEL: Record<Nivel, { texto: string; icono: NombreIcono; clase: string }> = {
  ALTA: { texto: "Prioridad alta", icono: "alerta", clase: estilos.alta },
  MEDIA: { texto: "Prioridad media", icono: "info", clase: estilos.media },
  BAJA: { texto: "Prioridad baja", icono: "check", clase: estilos.baja },
};

export function EtiquetaNivel({ nivel }: { nivel: Nivel }) {
  const n = NIVEL[nivel];
  return (
    <span className={`${estilos.nivel} ${n.clase}`}>
      <Icono nombre={n.icono} tamano={16} />
      {n.texto}
    </span>
  );
}

// ───────────── Indicador con variación ─────────────

type Indicador = { titulo: string; valor: number; detalle?: ReactNode; anterior?: number; textoPeriodo?: string; href?: string };

/** Cifra destacada. La variación se describe con texto neutro: más o menos no es bueno ni malo por sí solo. */
export function Indicador({ titulo, valor, detalle, anterior, textoPeriodo = "período anterior", href }: Indicador) {
  let variacion: string | null = null;
  if (anterior !== undefined) {
    const diferencia = valor - anterior;
    variacion =
      diferencia === 0
        ? `Igual que el ${textoPeriodo} (${numero(anterior)})`
        : anterior === 0
          ? `${numero(diferencia)} más que el ${textoPeriodo} (0)`
          : `${diferencia > 0 ? "Sube" : "Baja"} ${porcentaje(Math.abs(diferencia) / anterior)} respecto del ${textoPeriodo} (${numero(anterior)})`;
  }
  return (
    <div className={estilos.indicador}>
      {href ? (
        <Link href={href} className={estilos.tituloIndicador}>
          {titulo}
        </Link>
      ) : (
        <span className={estilos.tituloIndicador}>{titulo}</span>
      )}
      <strong className={estilos.cifra}>
        <Cifra valor={valor} />
      </strong>
      {variacion && <span>{variacion}</span>}
      {detalle && <span className="nota">{detalle}</span>}
    </div>
  );
}

// ───────────── Ocupación de cupos por servicio ─────────────

type Ocupacion = { servicioId: string; nombre: string; capacidad: number; ocupados: number; invitados: number; espera: number; retenidos?: number };

export function BarrasOcupacion({ ocupacion }: { ocupacion: Ocupacion[] }) {
  return (
    <ul className={estilos.ocupacion}>
      {ocupacion.map((o) => {
        const fraccion = o.capacidad > 0 ? Math.min(1, o.ocupados / o.capacidad) : 0;
        return (
          <li key={o.servicioId}>
            <div className={estilos.filaOcupacion}>
              <span>{o.nombre}</span>
              <span>
                <b>
                  {numero(o.ocupados)} de {numero(o.capacidad)}
                </b>{" "}
                ({porcentaje(fraccion)})
                {o.invitados > 0 && ` · ${numero(o.invitados)} por confirmar`}
                {(o.retenidos ?? 0) > 0 && ` · ${numero(o.retenidos!)} retenidos por invitaciones`}
                {o.espera > 0 && ` · ${numero(o.espera)} en espera`}
              </span>
            </div>
            <div className={estilos.medidor} role="meter" aria-valuemin={0} aria-valuemax={o.capacidad} aria-valuenow={o.ocupados} aria-label={`Cupos ocupados de ${o.nombre}`}>
              <span style={{ width: `${fraccion * 100}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ───────────── Tarjeta de recomendación (sección 12) ─────────────

type TarjetaPrioridadProps = {
  prioridad: Prioridad & { clave: string };
  puedeGestionar: boolean;
  puedeDecidir: boolean;
  nivelTitulo?: "h2" | "h3";
  conEnlaceSector?: boolean;
  /** Desde dónde se crea el operativo: queda registrado como su origen. */
  origen?: "RECOMENDACION" | "FICHA_SECTOR";
};

export function TarjetaPrioridad({ prioridad: p, puedeGestionar, puedeDecidir, nivelTitulo: Titulo = "h3", conEnlaceSector = true, origen = "RECOMENDACION" }: TarjetaPrioridadProps) {
  return (
    <article className={estilos.prioridad}>
      <div className={estilos.encabezadoPrioridad}>
        <Titulo>{p.nombre}</Titulo>
        <EtiquetaNivel nivel={p.nivel} />
      </div>
      <div>
        <b>Por qué:</b>
        <ul className={estilos.motivos}>
          {p.motivos.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </div>
      <p>
        <b>Recomendación:</b> {p.recomendacion}
      </p>
      <p className="nota">
        Índice {numero(p.puntaje, 2)} de 1. Basado en {numero(p.registros)} registros, confianza {p.confianza}.
      </p>
      <div className={estilos.acciones}>
        {puedeGestionar && <EnlaceBoton href={`/panel/operativos/nuevo?sector=${p.clave}&origen=${origen}`}>Crear operativo</EnlaceBoton>}
        {puedeDecidir && <MarcarEvaluado sectorId={p.sectorId} />}
      </div>
    </article>
  );
}

// ───────────── Bandeja de pendientes ─────────────

export function Bandeja({ items }: { items: { texto: string; cantidad: number; icono: NombreIcono; href?: string }[] }) {
  return (
    <ul className={estilos.bandeja}>
      {items.map((i) => (
        <li key={i.texto}>
          <Icono nombre={i.icono} tamano={24} />
          <span className={estilos.cantidadBandeja}>{numero(i.cantidad)}</span>
          {i.href ? <Link href={i.href}>{i.texto}</Link> : <span>{i.texto}</span>}
        </li>
      ))}
    </ul>
  );
}
