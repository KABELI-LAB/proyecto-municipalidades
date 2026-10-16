import Link from "next/link";
import { Suspense } from "react";
import { BarraVolver } from "@/componentes/BarraVolver";
import type { ReactNode } from "react";
import { Cauce } from "@/componentes/Cauce";
import { Icono } from "@/componentes/Icono";
import { Logo } from "@/componentes/Logo";
import { FranjaDemo } from "@/componentes/FranjaDemo";
import { Pawni } from "@/componentes/portal/pawni/Pawni";
import { frasesFijasPawni } from "@/dominio/asistente";
import { municipioActivo } from "@/lib/municipio";
import { hayDemoEnCache } from "@/servidor/portal/enCache";
import { firmasVoz } from "@/servidor/portal/voz";
import estilos from "./portal.module.css";

// Las páginas públicas se guardan armadas hasta 60 segundos (o hasta que una
// acción las renueve): así Netlify las entrega sin consultar la base en cada visita.
export const revalidate = 60;

export default async function LayoutPortal({ children }: { children: ReactNode }) {
  const municipio = municipioActivo();
  const demo = await hayDemoEnCache();

  return (
    <>
      <a className="saltar" href="#contenido">
        Ir al contenido
      </a>
      {demo && <FranjaDemo />}
      <header className={estilos.encabezado}>
        <div className={`contenedor ${estilos.barra}`}>
          <Link href="/" className={estilos.inicio} aria-label={`Inicio · ${municipio.plataforma} · ${municipio.nombreOficial}`}>
            <Logo municipio={municipio} variante="ciudadano" />
            <span className={estilos.programa}>{municipio.plataforma}</span>
          </Link>
          {/* El seguimiento de trámites es lo que más se busca al volver: siempre a mano. */}
          <Link href="/mis-solicitudes" className={estilos.solicitudes} data-recorrido="solicitudes">
            <Icono nombre="documento" tamano={20} />
            Mis solicitudes
          </Link>
        </div>
      </header>
      <main id="contenido" className={estilos.principal}>
        <Suspense fallback={null}>
          <BarraVolver contexto="portal" />
        </Suspense>
        {children}
      </main>
      {/* Pie: el Cauce del escudo da paso a la franja azul de la institución. */}
      <footer className={estilos.pie}>
        <Cauce className={estilos.caucePie} colores="sobreAzul" grosor={28} separacion={70} />
        <div className={`contenedor ${estilos.filaPie}`}>
          <Logo municipio={municipio} variante="blanco" />
          <p>
            <b>{municipio.nombreOficial}</b>
            <br />
            {municipio.sitioWeb}
          </p>
          <Link href="/privacidad" className={estilos.accesoPanel}>
            Privacidad
          </Link>
          {/* Entrada discreta del equipo municipal al panel. */}
          <Link href="/panel/ingresar" className={estilos.accesoPanel}>
            <Icono nombre="documento" tamano={16} />
            Acceso funcionarios
          </Link>
        </div>
      </footer>
      {/* Pawni, el quiltro guía: conversación y recorrido por el portal. */}
      <Pawni nombre={municipio.plataforma} firmasVoz={firmasVoz(frasesFijasPawni(municipio.plataforma))} />
    </>
  );
}
