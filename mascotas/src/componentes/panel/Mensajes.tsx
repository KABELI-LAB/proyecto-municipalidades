"use client";
// Resultado de la última acción del panel. Vive en el layout, así que sigue
// visible aunque la acción cambie la página (por ejemplo, al publicar, el botón
// «Publicar» desaparece y su mensaje se perdería).
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Icono } from "@/componentes/Icono";
import estilos from "./acciones.module.css";

type Mensaje = { ok: boolean; texto: string; id: number };
const Contexto = createContext<(m: { ok: boolean; texto: string }) => void>(() => {});

export function useMensaje() {
  return useContext(Contexto);
}

export function ProveedorMensajes({ children }: { children: ReactNode }) {
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const ruta = usePathname();
  useEffect(() => {
    if (mensaje) ref.current?.focus();
  }, [mensaje]);
  // Al ir a otra página, el mensaje de la acción anterior ya no corresponde.
  useEffect(() => setMensaje(null), [ruta]);

  return (
    <Contexto.Provider value={(m) => setMensaje({ ...m, id: Date.now() })}>
      {mensaje && (
        <div ref={ref} tabIndex={-1} className={`contenedor ${estilos.mensajeGlobal}`} role={mensaje.ok ? "status" : "alert"}>
          <p className={mensaje.ok ? estilos.exito : estilos.error}>
            <Icono nombre={mensaje.ok ? "check" : "alerta"} tamano={20} />
            {mensaje.texto}
          </p>
          <button type="button" className={estilos.cerrarMensaje} onClick={() => setMensaje(null)}>
            Cerrar mensaje
          </button>
        </div>
      )}
      {children}
    </Contexto.Provider>
  );
}
