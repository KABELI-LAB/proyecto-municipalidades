"use client";
// Crear un operativo en un solo formulario corto: lugar (el sector se deduce),
// fecha, horario y cupos por servicio con un número ya sugerido; los
// requisitos van plegados. Al confirmar se publica de una vez.
import { useState, useTransition } from "react";
import { Boton, EnlaceBoton } from "@/componentes/Boton";
import { CampoArea, CampoSelect, CampoTexto, type Opcion } from "@/componentes/formulario/Campos";
import { Icono } from "@/componentes/Icono";
import { capacidadSugerida } from "@/dominio/operativos";
import { crearYPublicarOperativo } from "@/servidor/panel/acciones-operativos";
import formulario from "@/componentes/formulario/formulario.module.css";

type Props = {
  /** Lugares públicos agrupados por sector; `sector` para deducir la demanda. */
  lugares: (Opcion & { sectorId: string })[];
  servicios: { id: string; nombre: string }[];
  /** Solicitudes pendientes por sector y servicio: { sectorId: { servicioId: n } }. */
  demanda: Record<string, Record<string, number>>;
  hoy: string;
};

const REQUISITOS = "Presentar cédula de identidad. Esterilización: ayuno de [horas] y edad mínima de [edad].";

export function FormularioRapido({ lugares, servicios, demanda, hoy }: Props) {
  const [v, setV] = useState({ lugarId: "", fecha: "", horaInicio: "09:30", horaFin: "14:00", requisitos: REQUISITOS });
  const sugeridos = (sectorId: string) => Object.fromEntries(servicios.map((s) => [s.id, String(capacidadSugerida(demanda[sectorId]?.[s.id] ?? 0))]));
  const [cupos, setCupos] = useState<Record<string, string>>(() => sugeridos(""));
  const [tocados, setTocados] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [hecho, setHecho] = useState<{ id: string; mensaje: string } | null>(null);
  const [enviando, iniciar] = useTransition();
  const cambiar = (k: keyof typeof v) => (x: string) => setV((a) => ({ ...a, [k]: x }));

  function elegirLugar(lugarId: string) {
    setV((a) => ({ ...a, lugarId }));
    // Mientras no se toquen los cupos, siguen la demanda del sector del lugar.
    const sector = lugares.find((l) => l.valor === lugarId)?.sectorId;
    if (!tocados && sector) setCupos(sugeridos(sector));
  }

  if (hecho) {
    return (
      <section className={`${formulario.resultado}`} aria-live="polite">
        <h2 className={formulario.tituloResultado}>
          <Icono nombre="check" tamano={32} />
          Operativo publicado
        </h2>
        <p>{hecho.mensaje}</p>
        <div className={formulario.navegacion}>
          <EnlaceBoton href={`/panel/operativos/${hecho.id}`}>Ver el operativo</EnlaceBoton>
          <EnlaceBoton href="/panel" variante="secundario">
            Volver al inicio
          </EnlaceBoton>
        </div>
      </section>
    );
  }

  function publicar(e: React.FormEvent) {
    e.preventDefault();
    iniciar(async () => {
      const r = await crearYPublicarOperativo({ ...v, capacidades: Object.fromEntries(Object.entries(cupos).map(([k, n]) => [k, Number(n || 0)])) });
      if (r.ok && r.id) setHecho({ id: r.id, mensaje: r.mensaje });
      else {
        setErrores("errores" in r && r.errores ? r.errores : {});
        setMensaje(r.mensaje);
      }
    });
  }

  return (
    <form className={`${formulario.formulario} ${formulario.formularioCorto}`} onSubmit={publicar} noValidate aria-label="Crear operativo">
      <CampoSelect id="lugarId" etiqueta="¿Dónde?" valor={v.lugarId} alCambiar={elegirLugar} error={errores.lugarId ?? errores.sectorId} opciones={lugares} ayuda="Un lugar público: plaza, escuela o recinto municipal." />
      <div className={formulario.fila}>
        <CampoTexto id="fecha" tipo="date" etiqueta="¿Qué día?" valor={v.fecha} alCambiar={cambiar("fecha")} error={errores.fecha} min={hoy} />
        <CampoTexto id="horaInicio" etiqueta="Desde" valor={v.horaInicio} alCambiar={cambiar("horaInicio")} error={errores.horaInicio} maxLength={5} />
        <CampoTexto id="horaFin" etiqueta="Hasta" valor={v.horaFin} alCambiar={cambiar("horaFin")} error={errores.horaFin} maxLength={5} />
      </div>

      <fieldset className={formulario.grupo}>
        <legend className={formulario.etiqueta}>Cupos por servicio</legend>
        <div className={formulario.fila}>
          {servicios.map((s) => (
            <CampoTexto
              key={s.id}
              id={`cupos-${s.id}`}
              etiqueta={s.nombre}
              inputMode="numeric"
              valor={cupos[s.id] ?? ""}
              alCambiar={(x) => {
                setTocados(true);
                setCupos((c) => ({ ...c, [s.id]: x.replace(/\D/g, "") }));
              }}
              maxLength={3}
            />
          ))}
        </div>
        <p className={formulario.ayuda}>Sugeridos según lo que piden las vecinas y vecinos del sector. Pon 0 si no se ofrece un servicio.</p>
        {errores.capacidades && (
          <p className={formulario.error}>
            <Icono nombre="alerta" tamano={18} />
            {errores.capacidades}
          </p>
        )}
      </fieldset>

      <details>
        <summary>Requisitos para los vecinos (opcional)</summary>
        <CampoArea id="requisitos" etiqueta="Requisitos" valor={v.requisitos} alCambiar={cambiar("requisitos")} error={errores.requisitos} maxLength={600} filas={3} />
      </details>

      {mensaje && (
        <p className={formulario.mensaje} role="alert">
          <Icono nombre="alerta" tamano={20} />
          {mensaje}
        </p>
      )}
      <div className={formulario.navegacion}>
        <Boton type="submit" disabled={enviando}>
          {enviando ? "Publicando…" : "Publicar operativo"}
        </Boton>
      </div>
      <p className="nota">Al publicarlo se abren las inscripciones en el portal y sale en Instagram.</p>
    </form>
  );
}
