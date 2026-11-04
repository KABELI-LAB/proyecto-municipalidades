"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Boton } from "@/componentes/Boton";
import { CampoArea, CampoSelect, CampoTexto } from "@/componentes/formulario/Campos";
import { Icono } from "@/componentes/Icono";
import { capacidadSugerida } from "@/dominio/operativos";
import { guardarOperativo } from "@/servidor/panel/acciones-operativos";
import formulario from "@/componentes/formulario/formulario.module.css";

type Props = {
  sectores: { id: string; nombre: string }[];
  /** Lugares públicos de referencia, de cada sector. */
  lugares: { id: string; nombre: string; sectorId: string }[];
  servicios: { id: string; nombre: string }[];
  /** Solicitudes pendientes por sector y servicio: { sectorId: { servicioId: n } }. */
  demanda: Record<string, Record<string, number>>;
  origen: "RECOMENDACION" | "FICHA_SECTOR" | "DESDE_CERO";
  hoy: string;
  inicial?: { id: string; sectorId: string; lugarId: string; fecha: string; horaInicio: string; horaFin: string; requisitos: string; capacidades: Record<string, number> };
  sectorInicial?: string;
};

const REQUISITOS = "Esterilización: ayuno de [horas] y edad mínima de [edad]. Presentar cédula de identidad.";

export function FormularioOperativo({ sectores, lugares, servicios, demanda, origen, hoy, inicial, sectorInicial }: Props) {
  const router = useRouter();
  const sugeridas = (sectorId: string) =>
    Object.fromEntries(servicios.map((s) => [s.id, sectorId ? String(capacidadSugerida(demanda[sectorId]?.[s.id] ?? 0)) : ""]));

  const [v, setV] = useState({
    sectorId: inicial?.sectorId ?? sectorInicial ?? "",
    lugarId: inicial?.lugarId ?? "",
    fecha: inicial?.fecha ?? "",
    horaInicio: inicial?.horaInicio ?? "09:30",
    horaFin: inicial?.horaFin ?? "14:00",
    requisitos: inicial?.requisitos ?? REQUISITOS,
  });
  const [cupos, setCupos] = useState<Record<string, string>>(
    // La sugerencia es solo una referencia: los cupos parten vacíos y los decide el equipo.
    inicial ? Object.fromEntries(servicios.map((s) => [s.id, String(inicial.capacidades[s.id] ?? 0)])) : {},
  );
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();
  const cambiar = (campo: keyof typeof v) => (valor: string) => setV((x) => ({ ...x, [campo]: valor }));

  function elegirSector(sectorId: string) {
    // El lugar depende del sector: al cambiar de sector se vuelve a elegir.
    setV((x) => ({ ...x, sectorId, lugarId: "" }));
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    iniciar(async () => {
      const r = await guardarOperativo({ ...v, id: inicial?.id, origen, capacidades: Object.fromEntries(Object.entries(cupos).map(([k, n]) => [k, Number(n || 0)])) });
      if (r.ok) {
        router.push(`/panel/operativos/${r.id}`);
      } else {
        setErrores(r.errores ?? {});
        setMensaje(r.mensaje);
      }
    });
  }

  return (
    <form className={formulario.formulario} onSubmit={guardar} noValidate>
      <CampoSelect id="sectorId" etiqueta="Sector" valor={v.sectorId} alCambiar={elegirSector} error={errores.sectorId} opciones={sectores.map((s) => ({ valor: s.id, texto: s.nombre }))} />
      <CampoSelect
        id="lugarId"
        etiqueta="Lugar de referencia"
        valor={v.lugarId}
        alCambiar={cambiar("lugarId")}
        error={errores.lugarId}
        ayuda={v.sectorId ? "Lugares públicos del sector: plazas, escuelas y recintos municipales." : "Elige primero el sector."}
        opciones={lugares.filter((l) => l.sectorId === v.sectorId).map((l) => ({ valor: l.id, texto: l.nombre }))}
      />
      <div className={formulario.fila}>
        <CampoTexto id="fecha" tipo="date" etiqueta="Fecha" valor={v.fecha} alCambiar={cambiar("fecha")} error={errores.fecha} min={hoy} />
        <CampoTexto id="horaInicio" etiqueta="Desde" valor={v.horaInicio} alCambiar={cambiar("horaInicio")} error={errores.horaInicio} ayuda="Formato 24 horas, por ejemplo 09:30." maxLength={5} />
        <CampoTexto id="horaFin" etiqueta="Hasta" valor={v.horaFin} alCambiar={cambiar("horaFin")} error={errores.horaFin} maxLength={5} />
      </div>

      <fieldset className={formulario.grupo} aria-describedby="cupos-ayuda">
        <legend className={formulario.etiqueta}>Cupos por servicio</legend>
        <p id="cupos-ayuda" className={formulario.ayuda}>
          Tú decides los cupos según el equipo y el lugar; usa 0 si no se ofrece un servicio. La referencia es la demanda pendiente del sector × 1,5, en múltiplos de 5, con un mínimo de 10.
        </p>
        <div className={formulario.fila}>
          {servicios.map((s) => {
            const pendientes = v.sectorId ? demanda[v.sectorId]?.[s.id] ?? 0 : null;
            return (
              <CampoTexto
                key={s.id}
                id={`cupos-${s.id}`}
                etiqueta={s.nombre}
                inputMode="numeric"
                valor={cupos[s.id] ?? ""}
                alCambiar={(x) => setCupos((c) => ({ ...c, [s.id]: x.replace(/\D/g, "") }))}
                ayuda={pendientes === null ? undefined : `${pendientes} pendientes en el sector · referencia: ${capacidadSugerida(pendientes)}`}
                maxLength={3}
              />
            );
          })}
        </div>
        {v.sectorId && (
          <div>
            <Boton type="button" variante="secundario" onClick={() => setCupos(sugeridas(v.sectorId))}>
              Usar las cifras de referencia
            </Boton>
          </div>
        )}
        {errores.capacidades && (
          <p className={formulario.error}>
            <Icono nombre="alerta" tamano={18} />
            {errores.capacidades}
          </p>
        )}
      </fieldset>

      <CampoArea id="requisitos" etiqueta="Requisitos visibles para la ciudadanía" valor={v.requisitos} alCambiar={cambiar("requisitos")} error={errores.requisitos} maxLength={600} ayuda="Ayuno, edad mínima, documentos. Usa corchetes para lo que aún no se define, por ejemplo [horas]." />

      {mensaje && (
        <p className={formulario.mensaje} role="alert">
          <Icono nombre="alerta" tamano={20} />
          {mensaje}
        </p>
      )}
      <div className={formulario.navegacion}>
        <Boton type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : inicial ? "Guardar cambios" : "Guardar como borrador"}
        </Boton>
      </div>
      {!inicial && <p className="nota">El operativo queda en borrador. Al publicarlo invitaremos primero a quienes ya tienen solicitudes pendientes en el sector.</p>}
    </form>
  );
}
