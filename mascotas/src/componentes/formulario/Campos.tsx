"use client";
// Campos de formulario controlados y accesibles: etiqueta visible, ayuda y
// error asociados con aria-describedby; el error lleva ícono y texto.
import { useEffect, useState, type ReactNode } from "react";
import { Icono } from "@/componentes/Icono";
import { reducirFoto } from "@/lib/reducirFoto";
import estilos from "./formulario.module.css";

type Base = {
  id: string;
  etiqueta: string;
  error?: string;
  ayuda?: ReactNode;
  opcional?: boolean;
};

function Mensajes({ id, error, ayuda }: Pick<Base, "id" | "error" | "ayuda">) {
  return (
    <>
      {ayuda && (
        <p id={`${id}-ayuda`} className={estilos.ayuda}>
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={estilos.error}>
          <Icono nombre="alerta" tamano={18} />
          {error}
        </p>
      )}
    </>
  );
}

const describe = (id: string, error?: string, ayuda?: ReactNode) =>
  [ayuda ? `${id}-ayuda` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;

function Etiqueta({ id, etiqueta, opcional }: Pick<Base, "id" | "etiqueta" | "opcional">) {
  return (
    <label htmlFor={id} className={estilos.etiqueta}>
      {etiqueta}
      {opcional && <span className={estilos.opcional}> (opcional)</span>}
    </label>
  );
}

type Texto = Base & {
  valor: string;
  alCambiar: (v: string) => void;
  tipo?: "text" | "email" | "tel" | "date" | "password";
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
  maxLength?: number;
  min?: string;
  max?: string;
};

export function CampoTexto({ id, etiqueta, error, ayuda, opcional, valor, alCambiar, tipo = "text", ...resto }: Texto) {
  return (
    <div className={estilos.campo}>
      <Etiqueta id={id} etiqueta={etiqueta} opcional={opcional} />
      <input
        id={id}
        name={id}
        type={tipo}
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describe(id, error, ayuda)}
        className={estilos.control}
        {...resto}
      />
      <Mensajes id={id} error={error} ayuda={ayuda} />
    </div>
  );
}

/** `sugerencia`: ideas de qué escribir, dentro del cuadro mientras está vacío. */
export function CampoArea({ id, etiqueta, error, ayuda, opcional, valor, alCambiar, maxLength, sugerencia, filas = 5 }: Omit<Texto, "tipo"> & { sugerencia?: string; filas?: number }) {
  return (
    <div className={estilos.campo}>
      <Etiqueta id={id} etiqueta={etiqueta} opcional={opcional} />
      <textarea
        id={id}
        name={id}
        value={valor}
        rows={filas}
        maxLength={maxLength}
        placeholder={sugerencia}
        onChange={(e) => alCambiar(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describe(id, error, ayuda)}
        className={estilos.control}
      />
      {maxLength && (
        <p className={estilos.ayuda} aria-live="polite">
          {valor.length} de {maxLength} caracteres
        </p>
      )}
      <Mensajes id={id} error={error} ayuda={ayuda} />
    </div>
  );
}

/** `grupo`: en una lista, las opciones con el mismo grupo se muestran juntas bajo ese título. */
export type Opcion = { valor: string; texto: string; descripcion?: string; deshabilitada?: boolean; grupo?: string };

function OpcionesSelect({ opciones }: { opciones: Opcion[] }) {
  const item = (o: Opcion) => (
    <option key={o.valor} value={o.valor} disabled={o.deshabilitada}>
      {o.texto}
    </option>
  );
  if (!opciones.some((o) => o.grupo)) return <>{opciones.map(item)}</>;
  const grupos = [...new Set(opciones.map((o) => o.grupo ?? ""))];
  return (
    <>
      {grupos.map((g) => (
        <optgroup key={g} label={g}>
          {opciones.filter((o) => (o.grupo ?? "") === g).map(item)}
        </optgroup>
      ))}
    </>
  );
}

export function CampoSelect({ id, etiqueta, error, ayuda, opcional, valor, alCambiar, opciones }: Base & { valor: string; alCambiar: (v: string) => void; opciones: Opcion[] }) {
  return (
    <div className={estilos.campo}>
      <Etiqueta id={id} etiqueta={etiqueta} opcional={opcional} />
      <select
        id={id}
        name={id}
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describe(id, error, ayuda)}
        className={estilos.control}
      >
        <option value="">Elige una opción</option>
        <OpcionesSelect opciones={opciones} />
      </select>
      <Mensajes id={id} error={error} ayuda={ayuda} />
    </div>
  );
}

/** Opciones como tarjetas grandes (radio). */
export function CampoOpciones({ id, etiqueta, error, ayuda, valor, alCambiar, opciones, columnas = 2 }: Base & { valor: string; alCambiar: (v: string) => void; opciones: Opcion[]; columnas?: 1 | 2 | 3 }) {
  return (
    <fieldset className={estilos.grupo} aria-describedby={describe(id, error, ayuda)} aria-invalid={error ? true : undefined}>
      <legend className={estilos.etiqueta}>{etiqueta}</legend>
      <div className={`${estilos.opciones} ${estilos[`columnas${columnas}`]}`}>
        {opciones.map((o, i) => (
          <label key={o.valor} className={estilos.opcion} data-deshabilitada={o.deshabilitada || undefined}>
            <input
              type="radio"
              id={i === 0 ? id : undefined}
              name={id}
              value={o.valor}
              checked={valor === o.valor}
              disabled={o.deshabilitada}
              onChange={() => alCambiar(o.valor)}
            />
            <span>
              <b>{o.texto}</b>
              {o.descripcion && <span className={estilos.descripcion}>{o.descripcion}</span>}
            </span>
          </label>
        ))}
      </div>
      <Mensajes id={id} error={error} ayuda={ayuda} />
    </fieldset>
  );
}

export function CampoCasillas({ id, etiqueta, error, ayuda, opcional, valores, alCambiar, opciones }: Base & { valores: string[]; alCambiar: (v: string[]) => void; opciones: Opcion[] }) {
  const alternar = (v: string) => alCambiar(valores.includes(v) ? valores.filter((x) => x !== v) : [...valores, v]);
  return (
    <fieldset className={estilos.grupo} aria-describedby={describe(id, error, ayuda)}>
      <legend className={estilos.etiqueta}>
        {etiqueta}
        {opcional && <span className={estilos.opcional}> (opcional)</span>}
      </legend>
      <div className={`${estilos.opciones} ${estilos.columnas2}`}>
        {opciones.map((o, i) => (
          <label key={o.valor} className={estilos.opcion}>
            <input type="checkbox" id={i === 0 ? id : undefined} name={id} value={o.valor} checked={valores.includes(o.valor)} onChange={() => alternar(o.valor)} />
            <span>
              <b>{o.texto}</b>
            </span>
          </label>
        ))}
      </div>
      <Mensajes id={id} error={error} ayuda={ayuda} />
    </fieldset>
  );
}

/**
 * Fotos en una fila de casillas del mismo tamaño: cada foto elegida con su
 * botón para quitarla y, al final, la casilla «Agregar foto». Agregar o quitar
 * una foto no mueve el resto del formulario.
 */
function FilaFotos({
  id,
  archivos,
  maximo,
  procesando,
  alQuitar,
  alElegir,
  descritoPor,
  invalido,
  multiple,
}: {
  id: string;
  archivos: Blob[];
  maximo: number;
  procesando: boolean;
  alQuitar: (i: number) => void;
  alElegir: (lista: FileList | null) => void;
  descritoPor?: string;
  invalido: boolean;
  multiple: boolean;
}) {
  return (
    <ul className={estilos.fotos} aria-label="Fotos elegidas">
      {archivos.map((a, i) => (
        <li key={i} className={estilos.casillaFoto}>
          <Vista archivo={a} alt={`Foto ${i + 1} elegida`} />
          <button type="button" className={estilos.quitarFoto} onClick={() => alQuitar(i)} aria-label={`Quitar foto ${i + 1}`}>
            <Icono nombre="cerrar" tamano={18} />
          </button>
        </li>
      ))}
      {archivos.length < maximo && (
        <li className={`${estilos.casillaFoto} ${estilos.agregarFoto}`}>
          <label htmlFor={id} data-invalido={invalido || undefined}>
            <Icono nombre="servicio" tamano={24} />
            <span>{procesando ? "Preparando…" : archivos.length ? "Agregar otra" : "Agregar foto"}</span>
          </label>
          <input
            id={id}
            name={id}
            type="file"
            accept="image/*"
            multiple={multiple}
            disabled={procesando}
            onChange={(e) => {
              alElegir(e.target.files);
              e.target.value = "";
            }}
            aria-invalid={invalido || undefined}
            aria-describedby={descritoPor}
            className="visualmente-oculto"
          />
        </li>
      )}
    </ul>
  );
}

/**
 * Una foto opcional: se reduce en el navegador antes de enviarse y se muestra
 * en miniatura con la opción de quitarla.
 */
export function CampoFoto({ id, etiqueta, error, ayuda, opcional, archivo, alCambiar }: Base & { archivo: Blob | null; alCambiar: (f: Blob | null) => void }) {
  const [procesando, setProcesando] = useState(false);
  const [errorLectura, setErrorLectura] = useState<string | null>(null);

  async function elegir(lista: FileList | null) {
    const f = lista?.[0];
    if (!f) return;
    setProcesando(true);
    setErrorLectura(null);
    try {
      alCambiar(await reducirFoto(f));
    } catch {
      alCambiar(null);
      setErrorLectura("No pudimos leer la foto. Prueba con otra imagen.");
    } finally {
      setProcesando(false);
    }
  }

  const mensajeError = errorLectura ?? error;
  return (
    <div className={estilos.campo}>
      <Etiqueta id={id} etiqueta={etiqueta} opcional={opcional} />
      <FilaFotos
        id={id}
        archivos={archivo ? [archivo] : []}
        maximo={1}
        procesando={procesando}
        alQuitar={() => alCambiar(null)}
        alElegir={elegir}
        descritoPor={describe(id, mensajeError ?? undefined, ayuda)}
        invalido={Boolean(mensajeError)}
        multiple={false}
      />
      <Mensajes id={id} error={mensajeError ?? undefined} ayuda={ayuda} />
    </div>
  );
}

/** Vista previa de una foto elegida, con su URL temporal liberada al quitarla. */
function Vista({ archivo, alt }: { archivo: Blob; alt: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const u = URL.createObjectURL(archivo);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [archivo]);
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img src={url} alt={alt} /> : null;
}

/**
 * Varias fotos (hasta `maximo`): cada una se reduce en el navegador, se ve en
 * miniatura y se puede quitar. Se agregan de a una o varias a la vez.
 */
export function CampoFotos({
  id,
  etiqueta,
  error,
  ayuda,
  opcional,
  archivos,
  alCambiar,
  maximo,
}: Base & { archivos: Blob[]; alCambiar: (f: Blob[]) => void; maximo: number }) {
  const [procesando, setProcesando] = useState(false);
  const [errorLectura, setErrorLectura] = useState<string | null>(null);

  async function agregar(lista: FileList | null) {
    if (!lista?.length) return;
    setProcesando(true);
    setErrorLectura(null);
    const nuevas: Blob[] = [];
    for (const f of [...lista].slice(0, maximo - archivos.length)) {
      try {
        nuevas.push(await reducirFoto(f));
      } catch {
        setErrorLectura("No pudimos leer una de las fotos. Prueba con otra imagen.");
      }
    }
    if (lista.length > maximo - archivos.length) setErrorLectura(`Puedes agregar hasta ${maximo} fotos.`);
    alCambiar([...archivos, ...nuevas]);
    setProcesando(false);
  }

  const mensajeError = errorLectura ?? error;
  return (
    <div className={estilos.campo}>
      <Etiqueta id={id} etiqueta={etiqueta} opcional={opcional} />
      <FilaFotos
        id={id}
        archivos={archivos}
        maximo={maximo}
        procesando={procesando}
        alQuitar={(i) => alCambiar(archivos.filter((_, j) => j !== i))}
        alElegir={agregar}
        descritoPor={describe(id, mensajeError ?? undefined, ayuda)}
        invalido={Boolean(mensajeError)}
        multiple
      />
      <Mensajes id={id} error={mensajeError ?? undefined} ayuda={ayuda} />
    </div>
  );
}
