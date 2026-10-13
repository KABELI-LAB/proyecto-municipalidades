"use client";
import { useCallback, useRef, useState, useTransition } from "react";
import type { z } from "zod";
import { validarCampos, type Errores } from "@/lib/esquemas";

type Valores = Record<string, string | string[]>;
type Respuesta = { ok: true } | { ok: false; errores?: Errores; mensaje?: string };

/**
 * Estado de un trámite de tres pasos: valores, errores por campo, paso actual
 * y envío. `pasos` lista los campos que valida cada paso antes de avanzar.
 */
export function useTramite<V extends Valores>(esquema: z.ZodType, inicial: V, pasos: readonly (readonly string[])[]) {
  const [valores, setValores] = useState<V>(inicial);
  const [errores, setErrores] = useState<Errores>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [paso, setPaso] = useState(0);
  const [enviando, iniciar] = useTransition();
  const titulo = useRef<HTMLHeadingElement>(null);
  // Evita un segundo envío si se hace doble clic antes de que se deshabilite el botón.
  const enCurso = useRef(false);

  const enfocarTitulo = () => requestAnimationFrame(() => titulo.current?.focus());
  const enfocarError = (e: Errores) =>
    requestAnimationFrame(() => {
      const primero = Object.keys(e)[0];
      if (primero) (document.getElementById(primero) ?? document.querySelector<HTMLElement>(`[name="${primero}"]`))?.focus();
    });

  const cambiar = useCallback((campo: string, valor: string | string[]) => {
    setValores((v) => ({ ...v, [campo]: valor }));
    setErrores((e) => {
      if (!(campo in e)) return e;
      const { [campo]: _, ...resto } = e;
      return resto;
    });
  }, []);

  function avanzar() {
    const e = validarCampos(esquema, valores, pasos[paso]);
    setErrores(e);
    setMensaje(null);
    if (Object.keys(e).length > 0) return enfocarError(e);
    setPaso((p) => p + 1);
    enfocarTitulo();
  }

  function volver() {
    setMensaje(null);
    setPaso((p) => Math.max(0, p - 1));
    enfocarTitulo();
  }

  /** Volver a un paso anterior (por ejemplo, «Editar» en el resumen). Nunca salta hacia adelante sin validar. */
  function irA(destino: number) {
    if (destino < 0 || destino >= paso) return;
    setMensaje(null);
    setPaso(destino);
    enfocarTitulo();
  }

  function enviar<R extends Respuesta>(accion: (v: V) => Promise<R>, alTerminar: (r: Extract<R, { ok: true }>) => void) {
    if (enCurso.current) return;
    enCurso.current = true;
    iniciar(async () => {
      let r: R;
      try {
        r = await accion(valores);
      } catch {
        enCurso.current = false;
        setMensaje("No pudimos enviar su solicitud. Revise su conexión e intente nuevamente; sus datos siguen aquí.");
        return;
      }
      enCurso.current = false;
      if (r.ok) return alTerminar(r as Extract<R, { ok: true }>);
      const e = r.errores ?? {};
      setErrores(e);
      setMensaje(r.mensaje ?? null);
      // Si el servidor objeta un campo de un paso anterior, volvemos a ese paso.
      const pasoConError = pasos.findIndex((campos) => campos.some((c) => c in e));
      if (pasoConError >= 0 && pasoConError !== paso) {
        setPaso(pasoConError);
        enfocarError(e);
      }
    });
  }

  return { valores, cambiar, errores, mensaje, paso, total: pasos.length, avanzar, volver, irA, enviar, enviando, titulo };
}

export type Tramite<V extends Valores> = ReturnType<typeof useTramite<V>>;
