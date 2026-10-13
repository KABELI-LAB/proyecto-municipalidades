"use client";
// Botones «Inicio» y «Volver a …» arriba de cada página. «Volver» lleva a la
// página de la que depende la actual (no al historial del navegador), para que
// siempre sea predecible. En el inicio no se muestra; en las secciones
// principales, solo «Inicio».
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Icono } from "@/componentes/Icono";
import { CONFIG, destinoVolver, type Contexto } from "./destinoVolver";
import estilos from "./BarraVolver.module.css";

export function BarraVolver({ contexto }: { contexto: Contexto }) {
  const ruta = usePathname();
  const parametros = useSearchParams();
  const c = CONFIG[contexto];
  if (ruta === c.inicio) return null;
  const volver = destinoVolver(contexto, ruta, parametros);

  return (
    <nav aria-label="Navegación de regreso" className={`contenedor ${estilos.barra}`}>
      {volver && (
        <Link href={volver.href} className={estilos.boton}>
          <Icono nombre="volver" tamano={20} />
          {volver.texto}
        </Link>
      )}
      <Link href={c.inicio} className={estilos.boton}>
        <Icono nombre="casa" tamano={20} />
        {c.textoInicio}
      </Link>
    </nav>
  );
}
