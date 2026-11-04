"use client";
// Asistencia del operativo en curso: buscar a la persona, marcar si llegó y
// registrar la atención. Botones grandes, un paso a la vez (sirve en el teléfono).
import { useMemo, useState, useTransition } from "react";
import { Boton } from "@/componentes/Boton";
import { EtiquetaEstado } from "@/componentes/EtiquetaEstado";
import { Icono } from "@/componentes/Icono";
import { ESTADO_CUPO, RESULTADO_ATENCION } from "@/dominio/etiquetas";
import { deshacerAtencion, marcarAsistencia, registrarAtencion, registrarEspontanea } from "@/servidor/panel/acciones-terreno";
import estilos from "./asistencia.module.css";

type Cupo = {
  id: string;
  codigo: string;
  servicioId: string;
  servicio: string;
  persona: string;
  animal: string;
  estado: string;
  atencion: { resultado: string; observaciones: string | null } | null;
};

type Props = {
  operativoId: string;
  enCurso: boolean;
  servicios: { id: string; nombre: string }[];
  cupos: Cupo[];
  espontaneas: { id: string; texto: string }[];
};

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function ListaAsistencia({ operativoId, enCurso, servicios, cupos, espontaneas }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [servicio, setServicio] = useState("");
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return cupos.filter((c) => (!servicio || c.servicioId === servicio) && (!q || normalizar(`${c.persona} ${c.codigo} ${c.animal}`).includes(q)));
  }, [cupos, busqueda, servicio]);

  const atendidos = cupos.filter((c) => c.atencion).length;
  const presentes = cupos.filter((c) => c.estado === "ASISTIO").length;

  return (
    <>
      <p className={estilos.contadores} aria-live="polite">
        <span>
          <b>{presentes}</b> llegaron
        </span>
        <span>
          <b>{atendidos}</b> atendidos
        </span>
        <span>
          <b>{espontaneas.length}</b> sin inscripción
        </span>
        <span>
          de <b>{cupos.length}</b> inscritos
        </span>
      </p>

      {mensaje && (
        <p className={mensaje.ok ? estilos.exito : estilos.error} role={mensaje.ok ? "status" : "alert"}>
          <Icono nombre={mensaje.ok ? "check" : "alerta"} tamano={20} />
          {mensaje.texto}
        </p>
      )}

      <div className={estilos.filtros}>
        <label htmlFor="buscar" className={estilos.etiqueta}>
          Buscar por nombre, código o animal
        </label>
        <input id="buscar" type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={estilos.control} autoComplete="off" />
        <div className={estilos.pestanas} role="group" aria-label="Filtrar por servicio">
          {[{ id: "", nombre: "Todos" }, ...servicios].map((s) => (
            <button key={s.id} type="button" aria-pressed={servicio === s.id} className={estilos.pestana} onClick={() => setServicio(s.id)}>
              {s.nombre}
            </button>
          ))}
        </div>
      </div>

      <ul className={estilos.lista} aria-label="Inscritos">
        {visibles.map((c) => (
          <li key={c.id}>
            <TarjetaCupo cupo={c} enCurso={enCurso} alResponder={setMensaje} />
          </li>
        ))}
        {visibles.length === 0 && <li className={estilos.aviso}>No hay inscritos con ese filtro.</li>}
      </ul>

      {enCurso && <AtencionEspontanea operativoId={operativoId} servicios={servicios} alResponder={setMensaje} />}

      {espontaneas.length > 0 && (
        <section className={estilos.pila} aria-labelledby="espontaneas">
          <h2 id="espontaneas">Atenciones sin inscripción</h2>
          <ul>
            {espontaneas.map((e) => (
              <li key={e.id}>{e.texto}</li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

type Responder = (m: { ok: boolean; texto: string }) => void;

function TarjetaCupo({ cupo: c, enCurso, alResponder }: { cupo: Cupo; enCurso: boolean; alResponder: Responder }) {
  const [enviando, iniciar] = useTransition();
  const [resultado, setResultado] = useState("REALIZADA");
  const [observaciones, setObservaciones] = useState("");
  const correr = (fn: () => Promise<{ ok: boolean; mensaje: string }>) =>
    iniciar(async () => {
      const r = await fn();
      alResponder({ ok: r.ok, texto: r.mensaje });
    });

  return (
    <article className={estilos.tarjeta}>
      <div className={estilos.cabeceraTarjeta}>
        <b>{c.persona}</b>
        <EtiquetaEstado estado={ESTADO_CUPO[c.estado]} />
      </div>
      <span>{c.animal}</span>
      <span className="nota">
        {c.servicio} · {c.codigo}
      </span>

      {enCurso && (c.estado === "INVITADO" || c.estado === "CONFIRMADO") && (
        <div className={estilos.botones}>
          <Boton disabled={enviando} onClick={() => correr(() => marcarAsistencia(c.id, true))}>
            Llegó
          </Boton>
          <Boton variante="secundario" disabled={enviando} onClick={() => correr(() => marcarAsistencia(c.id, false))}>
            No asistió
          </Boton>
        </div>
      )}

      {enCurso && c.estado === "NO_ASISTIO" && (
        <Boton variante="secundario" disabled={enviando} onClick={() => correr(() => marcarAsistencia(c.id, true))}>
          Llegó más tarde
        </Boton>
      )}

      {enCurso && c.estado === "ASISTIO" && !c.atencion && (
        <form
          className={estilos.pila}
          onSubmit={(e) => {
            e.preventDefault();
            correr(() => registrarAtencion(c.id, { resultado, observaciones }));
          }}
        >
          <fieldset className={estilos.grupo}>
            <legend className={estilos.etiqueta}>Resultado de la atención</legend>
            {Object.entries(RESULTADO_ATENCION).map(([valor, texto]) => (
              <label key={valor} className={estilos.opcion}>
                <input type="radio" name={`resultado-${c.id}`} value={valor} checked={resultado === valor} onChange={() => setResultado(valor)} />
                {texto}
              </label>
            ))}
          </fieldset>
          <label htmlFor={`obs-${c.id}`} className={estilos.etiqueta}>
            Observaciones <span className={estilos.opcional}>(opcional)</span>
          </label>
          <textarea id={`obs-${c.id}`} rows={2} maxLength={300} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className={estilos.control} />
          <Boton type="submit" disabled={enviando}>
            Guardar atención
          </Boton>
        </form>
      )}

      {c.atencion && (
        <div className={estilos.registro}>
          <span>
            <Icono nombre="check" tamano={18} /> Atención: <b>{RESULTADO_ATENCION[c.atencion.resultado]}</b>
            {c.atencion.observaciones ? ` · ${c.atencion.observaciones}` : ""}
          </span>
          {enCurso && (
            <Boton variante="secundario" disabled={enviando} onClick={() => correr(() => deshacerAtencion(c.id))}>
              Corregir
            </Boton>
          )}
        </div>
      )}
    </article>
  );
}

function AtencionEspontanea({ operativoId, servicios, alResponder }: { operativoId: string; servicios: { id: string; nombre: string }[]; alResponder: Responder }) {
  const vacio = { servicioId: "", especie: "", sexo: "", nombreAnimal: "", resultado: "REALIZADA", observaciones: "" };
  const [abierto, setAbierto] = useState(false);
  const [v, setV] = useState(vacio);
  const [enviando, iniciar] = useTransition();
  const campo = (k: keyof typeof vacio) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value }));

  if (!abierto) {
    return (
      <Boton variante="secundario" onClick={() => setAbierto(true)}>
        Registrar atención sin inscripción
      </Boton>
    );
  }
  return (
    <form
      className={`${estilos.tarjeta} ${estilos.pila}`}
      onSubmit={(e) => {
        e.preventDefault();
        iniciar(async () => {
          const r = await registrarEspontanea(operativoId, v);
          alResponder({ ok: r.ok, texto: r.mensaje });
          if (r.ok) {
            setV(vacio);
            setAbierto(false);
          }
        });
      }}
    >
      <h2>Atención sin inscripción</h2>
      <p className="nota">No se piden datos de la persona: solo los del animal y la atención.</p>
      {(
        [
          ["servicioId", "Servicio", servicios.map((s) => [s.id, s.nombre])],
          ["especie", "Especie", [["PERRO", "Perro"], ["GATO", "Gato"]]],
          ["sexo", "Sexo", [["MACHO", "Macho"], ["HEMBRA", "Hembra"], ["DESCONOCIDO", "No se sabe"]]],
          ["resultado", "Resultado", Object.entries(RESULTADO_ATENCION)],
        ] as const
      ).map(([k, etiqueta, opciones]) => (
        <div key={k} className={estilos.pila}>
          <label htmlFor={`esp-${k}`} className={estilos.etiqueta}>
            {etiqueta}
          </label>
          <select id={`esp-${k}`} value={v[k]} onChange={campo(k)} className={estilos.control} required>
            {k !== "resultado" && <option value="">Elige una opción</option>}
            {opciones.map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </select>
        </div>
      ))}
      <label htmlFor="esp-nombre" className={estilos.etiqueta}>
        Nombre del animal <span className={estilos.opcional}>(opcional)</span>
      </label>
      <input id="esp-nombre" value={v.nombreAnimal} onChange={campo("nombreAnimal")} maxLength={40} className={estilos.control} />
      <label htmlFor="esp-obs" className={estilos.etiqueta}>
        Observaciones <span className={estilos.opcional}>(opcional)</span>
      </label>
      <textarea id="esp-obs" rows={2} maxLength={300} value={v.observaciones} onChange={campo("observaciones")} className={estilos.control} />
      <div className={estilos.botones}>
        <Boton type="submit" disabled={enviando}>
          Guardar atención
        </Boton>
        <Boton variante="secundario" onClick={() => setAbierto(false)}>
          Cancelar
        </Boton>
      </div>
    </form>
  );
}
