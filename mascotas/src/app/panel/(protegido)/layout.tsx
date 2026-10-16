import { Suspense } from "react";
import { BarraVolver } from "@/componentes/BarraVolver";
import type { ReactNode } from "react";
import { Logo } from "@/componentes/Logo";
import { FranjaDemo } from "@/componentes/FranjaDemo";
import { ProveedorMensajes } from "@/componentes/panel/Mensajes";
import { NOMBRE_ROL } from "@/dominio/permisos";
import { municipioActivo } from "@/lib/municipio";
import { requerir } from "@/servidor/auth";
import { db } from "@/servidor/db";
import { hayDatosDemo } from "@/servidor/demo/borrar";
import { salir } from "@/servidor/panel/sesion";
import estilos from "@/componentes/panel/panel.module.css";

export const dynamic = "force-dynamic";

// Sin menú de módulos: todo se alcanza desde la pantalla principal del panel
// (tres bloques y unas pocas funciones más), como en el portal de vecinos.
export default async function LayoutPanel({ children }: { children: ReactNode }) {
  const usuario = await requerir();
  const municipio = municipioActivo();
  const demo = await hayDatosDemo(db);

  return (
    <>
      <a className="saltar" href="#contenido">
        Ir al contenido
      </a>
      {demo && <FranjaDemo />}
      <header className={estilos.encabezado}>
        <div className={`contenedor ${estilos.barra}`}>
          <div className={estilos.identidad}>
            <Logo municipio={municipio} variante="institucional" />
            <span className={estilos.modulo}>Panel municipal · {municipio.plataforma}</span>
          </div>
          <div className={estilos.cuenta}>
            <span>
              <b>{usuario.nombre}</b>
              <br />
              {NOMBRE_ROL[usuario.rol]}
            </span>
            <form action={salir}>
              <button type="submit" className={estilos.salir}>
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>
      <main id="contenido" className={estilos.principal}>
        <Suspense fallback={null}>
          <BarraVolver contexto="panel" />
        </Suspense>
        <ProveedorMensajes>{children}</ProveedorMensajes>
      </main>
    </>
  );
}
