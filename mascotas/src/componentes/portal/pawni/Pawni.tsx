"use client";
// Pawni, el quiltro guía del portal: un botón fijo con su cara, un saludo la
// primera vez, un panel de conversación con preguntas sugeridas y el
// recorrido guiado por el inicio. Responde con textos aprobados y enlaces del
// portal (src/dominio/asistente.ts); nunca pide datos personales.
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { Icono } from "@/componentes/Icono";
import { RECORRIDO, SUGERENCIAS, type AccionPawni, type AnimoPawni } from "@/dominio/asistente";
import { preguntarAPawni } from "@/servidor/portal/acciones-pawni";
import { AvatarPawni } from "./Avatar";
import { Recorrido } from "./Recorrido";
import { callar, decir, hayVoz } from "./voz";
import estilos from "./pawni.module.css";

type Mensaje = { id: number; de: "pawni" | "tu"; texto: string; acciones?: AccionPawni[] };

const SALUDO_VISTO = "pawni-saludo";
const RECORRIDO_PENDIENTE = "pawni-recorrido";
/** Tras este tiempo sin actividad, Pawni se echa a dormir. */
const SIESTA = 25_000;

const leer = (clave: string) => {
  try {
    return window.localStorage.getItem(clave);
  } catch {
    return null;
  }
};
const guardar = (clave: string, valor: string) => {
  try {
    window.localStorage.setItem(clave, valor);
  } catch {
    // Sin almacenamiento (modo privado): el saludo puede volver a aparecer.
  }
};

export function Pawni({ nombre }: { nombre: string }) {
  const ruta = usePathname();
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [saludo, setSaludo] = useState(false);
  const [recorrido, setRecorrido] = useState(false);
  const [animo, setAnimo] = useState<AnimoPawni>("saluda");
  const [mensajes, setMensajes] = useState<Mensaje[]>(() => [
    { id: 0, de: "pawni", texto: `¡Hola! Soy ${nombre}. Te cuento todo lo que puedes hacer en el portal. ¿Qué te gustaría saber?` },
  ]);
  const [texto, setTexto] = useState("");
  const [pensando, iniciar] = useTransition();
  const [voz, setVoz] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLDivElement>(null);
  const siesta = useRef<number | undefined>(undefined);

  // Actividad: despierta a Pawni y reinicia la cuenta para la siesta.
  const despertar = useCallback((nuevo: AnimoPawni = "atento") => {
    setAnimo(nuevo);
    window.clearTimeout(siesta.current);
    siesta.current = window.setTimeout(() => setAnimo("reposo"), SIESTA);
  }, []);

  useEffect(() => {
    setVoz(hayVoz());
    despertar("saluda");
    // El saludo aparece solo la primera vez.
    const t = leer(SALUDO_VISTO) ? undefined : window.setTimeout(() => setSaludo(true), 1200);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(siesta.current);
    };
  }, [despertar]);

  // Si se pidió el recorrido desde otra página, empieza al llegar al inicio.
  useEffect(() => {
    if (ruta !== "/" || leer(RECORRIDO_PENDIENTE) !== "1") return;
    guardar(RECORRIDO_PENDIENTE, "0");
    const t = window.setTimeout(() => setRecorrido(true), 400);
    return () => window.clearTimeout(t);
  }, [ruta]);

  useEffect(() => {
    lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: "smooth" });
  }, [mensajes, pensando]);

  useEffect(() => {
    if (!abierto) return;
    campo.current?.focus();
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cerrar no cambia de efecto
  }, [abierto]);

  const cerrarSaludo = () => {
    setSaludo(false);
    guardar(SALUDO_VISTO, "1");
  };

  const abrir = () => {
    cerrarSaludo();
    setAbierto(true);
    despertar("saluda");
  };

  const cerrar = () => {
    callar();
    setAbierto(false);
    despertar("atento");
    boton.current?.focus();
  };

  const empezarRecorrido = () => {
    cerrarSaludo();
    callar();
    setAbierto(false);
    if (ruta === "/") setRecorrido(true);
    else {
      guardar(RECORRIDO_PENDIENTE, "1");
      router.push("/");
    }
  };

  const preguntar = (pregunta: string) => {
    const limpia = pregunta.trim();
    if (!limpia || pensando) return;
    setMensajes((m) => [...m, { id: Date.now(), de: "tu", texto: limpia }]);
    setTexto("");
    despertar("atento");
    iniciar(async () => {
      try {
        const r = await preguntarAPawni(limpia);
        setMensajes((m) => [...m, { id: Date.now() + 1, de: "pawni", texto: r.texto, acciones: r.acciones }]);
        despertar(r.animo);
      } catch {
        setMensajes((m) => [...m, { id: Date.now() + 1, de: "pawni", texto: "No pude responder ahora. Inténtalo de nuevo en un momento." }]);
        despertar("atento");
      }
    });
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    preguntar(texto);
  };

  return (
    <>
      {recorrido && (
        <Recorrido
          alTerminar={() => {
            callar();
            setRecorrido(false);
            despertar("feliz");
          }}
        />
      )}

      {saludo && !abierto && !recorrido && (
        <div className={estilos.burbuja} role="dialog" aria-labelledby="pawni-saludo">
          <p id="pawni-saludo">
            ¡Hola! Soy <b>{nombre}</b>. ¿Te muestro el portal en un minuto?
          </p>
          <button type="button" className={estilos.cerrar} onClick={cerrarSaludo} aria-label="Cerrar el saludo">
            <Icono nombre="cerrar" tamano={20} />
          </button>
          <div className={estilos.burbujaBotones}>
            <button type="button" className={estilos.primario} onClick={empezarRecorrido}>
              Sí, muéstrame
            </button>
            <button type="button" className={estilos.enlaceTexto} onClick={cerrarSaludo}>
              Ahora no
            </button>
          </div>
        </div>
      )}

      {!abierto && !recorrido && (
        <button
          ref={boton}
          type="button"
          className={estilos.flotante}
          onClick={abrir}
          onMouseEnter={() => despertar("saluda")}
          onFocus={() => despertar("saluda")}
          aria-label={`Hablar con ${nombre}, tu guía del portal`}
        >
          <AvatarPawni animo={animo} tamano={64} />
        </button>
      )}

      {abierto && (
        <section className={estilos.panel} role="dialog" aria-labelledby="pawni-titulo">
          <header className={estilos.cabeza}>
            <AvatarPawni animo={pensando ? "atento" : animo} tamano={88} className={estilos.avatarGrande} />
            <h2 id="pawni-titulo">{nombre}</h2>
            <p>Tu quiltro guía en el portal.</p>
            <button type="button" className={estilos.cerrarClaro} onClick={cerrar} aria-label={`Cerrar la conversación con ${nombre}`}>
              <Icono nombre="cerrar" tamano={22} />
            </button>
          </header>

          <div ref={lista} className={estilos.conversacion} aria-live="polite">
            {mensajes.map((m) =>
              m.de === "tu" ? (
                <p key={m.id} className={estilos.tuyo}>
                  {m.texto}
                </p>
              ) : (
                <div key={m.id} className={estilos.suyo}>
                  <AvatarPawni animo="feliz" tamano={36} className={estilos.mini} />
                  <div>
                    <p className={estilos.globo}>{m.texto}</p>
                    {(m.acciones?.length || voz) && (
                      <div className={estilos.acciones}>
                        {m.acciones?.map((a) =>
                          a.href === RECORRIDO ? (
                            <button key={a.href} type="button" className={estilos.accion} onClick={empezarRecorrido}>
                              {a.texto}
                              <Icono nombre="flecha" tamano={18} />
                            </button>
                          ) : (
                            <Link key={a.href} href={a.href} className={estilos.accion} onClick={() => setAbierto(false)}>
                              {a.texto}
                              <Icono nombre="flecha" tamano={18} />
                            </Link>
                          ),
                        )}
                        {voz && (
                          <button type="button" className={estilos.enlaceTexto} onClick={() => decir(m.texto)}>
                            <Icono nombre="escuchar" tamano={18} />
                            Escuchar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}
            {pensando && (
              <div className={estilos.suyo} aria-label={`${nombre} está escribiendo`}>
                <AvatarPawni animo="atento" tamano={36} className={estilos.mini} />
                <span className={estilos.esqueleto} />
              </div>
            )}
          </div>

          <div className={estilos.pie}>
            <ul className={estilos.sugerencias} aria-label="Preguntas sugeridas">
              {SUGERENCIAS.map((s) => (
                <li key={s}>
                  <button type="button" onClick={() => preguntar(s)} disabled={pensando}>
                    {s}
                  </button>
                </li>
              ))}
              <li>
                <button type="button" onClick={empezarRecorrido}>
                  Muéstrame el portal
                </button>
              </li>
            </ul>
            <form className={estilos.formulario} onSubmit={enviar}>
              <label htmlFor="pawni-pregunta" className="visualmente-oculto">
                Escribe tu pregunta
              </label>
              <input
                ref={campo}
                id="pawni-pregunta"
                value={texto}
                onChange={(e) => {
                  setTexto(e.target.value);
                  if (animo !== "atento") despertar("atento");
                }}
                maxLength={300}
                placeholder="Escribe tu pregunta"
                autoComplete="off"
              />
              <button type="submit" className={estilos.enviar} disabled={pensando || !texto.trim()} aria-label="Enviar pregunta">
                <Icono nombre="enviar" tamano={22} />
              </button>
            </form>
            <p className={estilos.aviso}>No escribas tu RUT, dirección ni teléfono.</p>
          </div>
        </section>
      )}
    </>
  );
}
