// Piezas de presentación del panel municipal (componentes de servidor).
import Link from "next/link";
import type { ReactNode } from "react";
import { Cifra } from "@/componentes/Cifra";
import { Icono, type NombreIcono } from "@/componentes/Icono";
import { numero, porcentaje } from "@/dominio/formato";
import estilos from "./piezas.module.css";

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
