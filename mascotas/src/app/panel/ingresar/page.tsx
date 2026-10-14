import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/componentes/Logo";
import { FranjaDemo } from "@/componentes/FranjaDemo";
import { inicioDe } from "@/dominio/permisos";
import { municipioActivo } from "@/lib/municipio";
import { usuarioActual } from "@/servidor/auth";
import { db } from "@/servidor/db";
import { hayDatosDemo } from "@/servidor/demo/borrar";
import estilos from "@/componentes/panel/panel.module.css";
import { FormularioIngreso } from "./FormularioIngreso";

export const metadata: Metadata = { title: "Ingresar al panel municipal" };
export const dynamic = "force-dynamic";

export default async function PaginaIngresar() {
  const u = await usuarioActual();
  if (u) redirect(inicioDe(u.rol));
  const municipio = municipioActivo();
  const demo = await hayDatosDemo(db);

  return (
    <>
      {demo && <FranjaDemo />}
      <main className={estilos.ingreso}>
        <div className={estilos.marcoIngreso}>
          <div className={estilos.cabeceraIngreso}>
            <Logo municipio={municipio} variante="institucional" />
          </div>
          <div className={estilos.cuerpoIngreso}>
            <h1>Panel municipal</h1>
            <p>Programa de tenencia responsable. Acceso para funcionarios municipales.</p>
            <FormularioIngreso />
            {demo && (
              <p className="nota">
                Cuentas de demostración: demo/datos/usuarios.json. Contraseña: DEMO_CONTRASENA en el archivo .env.
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
