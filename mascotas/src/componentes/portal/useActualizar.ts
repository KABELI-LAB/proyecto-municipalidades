"use client";
// Vuelve a pedir datos cada cierto tiempo mientras la página está a la vista,
// y de inmediato al volver a ella (por ejemplo, al cambiar de pestaña). Así los
// mensajes nuevos aparecen sin recargar. En segundo plano no consulta nada.
import { useEffect, useRef } from "react";

export function useActualizar(actualizar: () => void, cadaMs: number, activo = true) {
  const funcion = useRef(actualizar);
  funcion.current = actualizar;

  useEffect(() => {
    if (!activo) return;
    const pedir = () => {
      if (document.visibilityState === "visible") funcion.current();
    };
    const reloj = window.setInterval(pedir, cadaMs);
    document.addEventListener("visibilitychange", pedir);
    window.addEventListener("focus", pedir);
    return () => {
      window.clearInterval(reloj);
      document.removeEventListener("visibilitychange", pedir);
      window.removeEventListener("focus", pedir);
    };
  }, [cadaMs, activo]);
}
