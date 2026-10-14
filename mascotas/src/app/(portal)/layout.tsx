import Link from "next/link";
import { Suspense } from "react";
import { BarraVolver } from "@/componentes/BarraVolver";
import type { ReactNode } from "react";
import { FirmaInstitucional } from "@/componentes/FirmaInstitucional";
import { Icono } from "@/componentes/Icono";
import { FranjaDemo } from "@/componentes/FranjaDemo";
import { municipioActivo } from "@/lib/municipio";
import { hayDemoEnCache } from "@/servidor/portal/enCache";
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
          <Link href="/" className={estilos.inicio} aria-label={`Inicio · Tenencia responsable · ${municipio.nombreOficial}`}>
            <FirmaInstitucional municipio={municipio} sobreAzul />
          </Link>
          {/* El seguimiento de trámites es lo que más se busca al volver: siempre a mano. */}
          <Link href="/mis-solicitudes" className={estilos.solicitudes}>
            <Icono nombre="documento" tamano={24} />
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
      {/* Pie mínimo: las secciones ya están en la portada y «Mis solicitudes» en la barra superior. */}
      <footer className={estilos.pie}>
        <div className={`contenedor ${estilos.filaPie}`}>
          <p>
            <b>{municipio.nombreOficial}</b> · {municipio.sitioWeb}
          </p>
          {/* Entrada discreta del equipo municipal al panel. */}
          <Link href="/panel/ingresar" className={estilos.accesoPanel}>
            <Icono nombre="documento" tamano={16} />
            Acceso funcionarios
          </Link>
        </div>
      </footer>
    </>
  );
}
