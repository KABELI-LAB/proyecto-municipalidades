import type { Metadata } from "next";
import { EnlaceBoton } from "@/componentes/Boton";
import { conversacionDeInteresado } from "@/servidor/portal/conversaciones";
import estilos from "@/estilos/paginas.module.css";
import { ConversacionInteresado } from "./ConversacionInteresado";

// Enlace privado: no se indexa ni se envía a otros sitios al salir de la página.
export const metadata: Metadata = { title: "Tu conversación", robots: { index: false, follow: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";

// Responde: ¿qué me respondieron y cómo sigo la conversación?
export default async function PaginaConversacion({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string }> }) {
  const [{ id }, { t = "" }] = await Promise.all([params, searchParams]);
  const conversacion = await conversacionDeInteresado(id, t);
  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <h1>Tu conversación</h1>
        <p>Es privada: ninguno ve el contacto del otro, salvo que lo compartan.</p>
      </div>
      {conversacion ? (
        <ConversacionInteresado id={id} t={t} inicial={conversacion} />
      ) : (
        <div className={estilos.vacio}>
          <p>No encontramos esta conversación. Abre el enlace más reciente que te llegó por correo.</p>
          <EnlaceBoton href="/">Volver al inicio</EnlaceBoton>
        </div>
      )}
    </div>
  );
}
