"use client";
// Recorrido guiado por el inicio: resalta cada parte marcada con
// data-recorrido y la explica en una tarjeta con Anterior, Siguiente y Saltar.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Boton } from "@/componentes/Boton";
import { Icono } from "@/componentes/Icono";
import type { AnimoPawni } from "@/dominio/asistente";
import { AvatarPawni } from "./Avatar";
import { decir } from "./voz";
import estilos from "./pawni.module.css";

type Paso = { marca: string; titulo: string; texto: string; animo: AnimoPawni };

const PASOS: Paso[] = [
  { marca: "operativos", titulo: "Operativos", texto: "Revisa fechas, servicios y cupos, e inscríbete en el de tu sector.", animo: "feliz" },
  { marca: "mascotas", titulo: "Mascotas perdidas y avistadas", texto: "Avisa si perdiste o viste una mascota. Te ayudamos a difundirlo.", animo: "atento" },
  { marca: "sos", titulo: "SOS Mascotas", texto: "Si ves un animal herido o en peligro, avísanos aquí.", animo: "atento" },
  { marca: "otros", titulo: "Más para hacer", texto: "Adopta, pide un servicio o conoce a los perros comunitarios.", animo: "feliz" },
  { marca: "mapa", titulo: "Tu comuna en el mapa", texto: "Mira las mascotas perdidas y avistadas por sector.", animo: "atento" },
  { marca: "solicitudes", titulo: "Mis solicitudes", texto: "Sigue el estado de tus trámites cuando quieras.", animo: "saluda" },
];

type Caja = { top: number; left: number; width: number; height: number };

/** En pantallas angostas la tarjeta va fija arriba y la página se desplaza bajo ella. */
const angosta = () => window.innerWidth < 600;
const MARGEN = 16;

/** El elemento visible con la marca (puede haber copias ocultas mientras la página termina de cargar). */
const buscar = (marca: string) =>
  [...document.querySelectorAll<HTMLElement>(`[data-recorrido="${marca}"]`)].find((e) => e.getClientRects().length > 0) ?? null;

export function Recorrido({ alTerminar }: { alTerminar: () => void }) {
  const [pasos] = useState(() => PASOS.filter((p) => document.querySelector(`[data-recorrido="${p.marca}"]`)));
  const [i, setI] = useState(0);
  const [caja, setCaja] = useState<Caja | null>(null);
  const [tarjeta, setTarjeta] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const paso = pasos[i];

  const medir = useCallback(() => {
    const el = paso && buscar(paso.marca);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const margen = 8;
    setCaja({ top: r.top - margen, left: r.left - margen, width: r.width + margen * 2, height: r.height + margen * 2 });
    const t = ref.current?.getBoundingClientRect();
    const alto = t?.height ?? 240;
    const ancho = t?.width ?? 360;
    if (angosta()) return setTarjeta({ top: MARGEN, left: MARGEN });
    const abajo = r.bottom + margen + 12;
    const top = abajo + alto < window.innerHeight - MARGEN ? abajo : Math.max(MARGEN, r.top - margen - 12 - alto);
    const left = Math.min(Math.max(MARGEN, r.left), window.innerWidth - ancho - MARGEN);
    setTarjeta({ top, left });
  }, [paso]);

  useEffect(() => {
    if (!paso) return alTerminar();
    ref.current?.focus({ preventScroll: true });
    // Desplazamiento directo: el movimiento lo pone el foco, que viaja con fundido.
    // Si la página aún termina de cargar, se reintenta un momento.
    let intentos = 0;
    let reloj: number | undefined;
    const llevar = () => {
      const el = buscar(paso.marca);
      if (!el) {
        if (++intentos < 15) reloj = window.setTimeout(llevar, 200);
        return;
      }
      if (angosta()) {
        // El elemento queda justo bajo la tarjeta.
        const alto = ref.current?.getBoundingClientRect().height ?? 240;
        window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - (MARGEN * 3 + alto) });
      } else el.scrollIntoView({ block: "center" });
    };
    llevar();
    return () => window.clearTimeout(reloj);
  }, [paso, alTerminar]);

  useLayoutEffect(() => {
    medir();
    window.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", medir);
    // Mientras la página se acomoda (fotos que cargan, desplazamiento), se vuelve a medir.
    const reloj = window.setInterval(medir, 200);
    const fin = window.setTimeout(() => window.clearInterval(reloj), 3200);
    return () => {
      window.removeEventListener("scroll", medir);
      window.removeEventListener("resize", medir);
      window.clearInterval(reloj);
      window.clearTimeout(fin);
    };
  }, [medir]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && alTerminar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [alTerminar]);

  if (!paso) return null;
  const ultimo = i === pasos.length - 1;

  return (
    <div className={estilos.recorrido}>
      {caja && <div className={estilos.foco} style={caja} aria-hidden="true" />}
      <div
        ref={ref}
        className={estilos.paso}
        style={tarjeta ?? { visibility: "hidden" }}
        role="dialog"
        aria-labelledby="pawni-paso-titulo"
        aria-describedby="pawni-paso-texto"
        tabIndex={-1}
      >
        <div className={estilos.pasoCabeza}>
          <AvatarPawni animo={paso.animo} tamano={48} />
          <span className={estilos.pasoNumero}>
            Paso <span className="dato">{i + 1}</span> de <span className="dato">{pasos.length}</span>
          </span>
          <button type="button" className={estilos.cerrar} onClick={alTerminar} aria-label="Cerrar el recorrido">
            <Icono nombre="cerrar" tamano={20} />
          </button>
        </div>
        <h2 id="pawni-paso-titulo">{paso.titulo}</h2>
        <p id="pawni-paso-texto">{paso.texto}</p>
        <div className={estilos.pasoEnlaces}>
          <button type="button" className={estilos.enlaceTexto} onClick={() => decir(`${paso.titulo}. ${paso.texto}`)}>
            <Icono nombre="escuchar" tamano={18} />
            Escuchar
          </button>
          <button type="button" className={estilos.enlaceTexto} onClick={alTerminar}>
            Saltar
          </button>
        </div>
        <div className={estilos.pasoBotones}>
          <Boton variante="secundario" onClick={() => setI(i - 1)} disabled={i === 0}>
            <Icono nombre="anterior" tamano={18} />
            Anterior
          </Boton>
          <Boton onClick={() => (ultimo ? alTerminar() : setI(i + 1))}>
            {ultimo ? "Terminar" : "Siguiente"}
            {!ultimo && <Icono nombre="siguiente" tamano={18} />}
          </Boton>
        </div>
      </div>
    </div>
  );
}
