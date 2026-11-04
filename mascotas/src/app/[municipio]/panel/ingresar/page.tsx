import Link from "next/link";
import { Icono } from "@/componentes/Icono";
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
  const municipio = (await municipioActivo());
  const demo = await hayDatosDemo(db);
  // Demostración: la cuenta del municipio ya escrita, para entrar con un clic.
  const cuentaDemo = demo && process.env.DEMO_CONTRASENA ? await db.usuarioMunicipal.findFirst({ where: { municipioId: municipio.id, loteDemoId: { not: null }, activo: true }, select: { correo: true } }) : null;

  return (
    <>
      {demo && <FranjaDemo municipio={municipio} />}
      <main className={estilos.ingreso}>
        <div className={estilos.marcoIngreso}>
          <div className={estilos.cabeceraIngreso}>
            <Logo municipio={municipio} variante="institucional" />
          </div>
          <div className={estilos.cuerpoIngreso}>
            <Link href="/" className={estilos.volverPortal}>
              <Icono nombre="casa" tamano={20} />
              Volver al portal
            </Link>
            <h1>Panel municipal</h1>
            <p>{municipio.plataforma}, programa de tenencia responsable. Acceso para funcionarios municipales.</p>
            <FormularioIngreso cuentaDemo={cuentaDemo ? { correo: cuentaDemo.correo, contrasena: process.env.DEMO_CONTRASENA! } : null} />
            {cuentaDemo && <p className="nota">Cuenta de demostración ya escrita: pulsa «Ingresar».</p>}
          </div>
        </div>
      </main>
    </>
  );
}
