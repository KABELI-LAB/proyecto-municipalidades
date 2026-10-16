"use client";
// Cifra grande que cuenta una sola vez al entrar en pantalla (CLAUDE.md,
// principios de interfaz). Sin JavaScript o con movimiento reducido se ve el
// valor final de inmediato.
import { useEffect, useRef, useState } from "react";

const DURACION_MS = 600;
const formato = new Intl.NumberFormat("es-CL");

export function Cifra({ valor, sufijo = "" }: { valor: number; sufijo?: string }) {
  const [mostrado, setMostrado] = useState(valor);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || valor === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let marco = 0;
    const contar = () => {
      const inicio = performance.now();
      const paso = (t: number) => {
        const avance = Math.min(1, (t - inicio) / DURACION_MS);
        setMostrado(Math.round(valor * (1 - (1 - avance) ** 3)));
        if (avance < 1) marco = requestAnimationFrame(paso);
      };
      marco = requestAnimationFrame(paso);
    };
    const observador = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      observador.disconnect();
      contar();
    });
    observador.observe(el);
    return () => {
      observador.disconnect();
      cancelAnimationFrame(marco);
    };
  }, [valor]);

  return (
    <span ref={ref}>
      <span aria-hidden="true">
        {formato.format(mostrado)}
        {sufijo}
      </span>
      <span className="visualmente-oculto">
        {formato.format(valor)}
        {sufijo}
      </span>
    </span>
  );
}
