import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EtiquetaEstado } from "@/componentes/EtiquetaEstado";
import { BotonAccion } from "@/componentes/panel/BotonAccion";
import { TIPO_AVISO } from "@/dominio/etiquetas";
import { requerir } from "@/servidor/auth";
import { diaISO } from "@/servidor/formato";
import { eliminarAviso, publicarAviso, retirarAviso } from "@/servidor/panel/acciones-avisos";
import { avisoPanel } from "@/servidor/panel/avisos";
import estilos from "@/estilos/paginas.module.css";
import { FormularioAviso } from "./FormularioAviso";

export const metadata: Metadata = { title: "Aviso · Panel municipal" };

// Responde: ¿este aviso está listo para publicarse?
export default async function AvisoPanel({ params }: { params: Promise<{ id: string }> }) {
  await requerir("gestionarAvisos");
  const { id } = await params;
  const a = await avisoPanel(id);
  if (!a) notFound();
  const terminado = a.vigenteHasta < new Date();
  const borrador = a.estado === "BORRADOR";

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <EtiquetaEstado estado={terminado ? { texto: "Terminado", tono: "cerrado" } : borrador ? { texto: "Borrador", tono: "recibido" } : { texto: "Publicado", tono: "confirmado" }} />
        <h1>{borrador ? "Revisar aviso" : "Aviso publicado"}</h1>
        <p>
          {TIPO_AVISO[a.tipo]} para {a.sectores.length ? a.sectores.map((s) => s.sector.nombre).join(", ") : "toda la comuna"}.
        </p>
      </div>

      <div className={estilos.grillaDos}>
        <section className={estilos.panel} aria-label="Contenido del aviso">
          <FormularioAviso id={a.id} inicial={{ titulo: a.titulo, texto: a.texto, desde: diaISO(a.vigenteDesde), hasta: diaISO(a.vigenteHasta) }} />
        </section>
        <section className={estilos.seccion} aria-labelledby="publicacion">
          <h2 id="publicacion">Publicación</h2>
          {borrador && !terminado && (
            <>
              <p>Al publicarlo, se muestra en el portal durante su vigencia, en los sectores indicados.</p>
              <BotonAccion accion={publicarAviso.bind(null, a.id)} texto="Publicar aviso" variante="primario" confirmar="El aviso se mostrará en el portal ciudadano. ¿Desea publicarlo?" textoConfirmar="Sí, publicar" />
            </>
          )}
          {!borrador && !terminado && (
            <>
              <p>Se muestra en el portal hasta el fin de su vigencia.</p>
              <BotonAccion accion={retirarAviso.bind(null, a.id)} texto="Retirar del portal" confirmar="El aviso dejará de mostrarse hoy. ¿Desea retirarlo?" textoConfirmar="Sí, retirar" />
            </>
          )}
          {terminado && <p>Su vigencia terminó. Para volver a usarlo, cambie las fechas.</p>}
          <BotonAccion accion={eliminarAviso.bind(null, a.id)} texto="Eliminar aviso" confirmar="El aviso dejará de verse y se eliminará. ¿Desea eliminarlo?" textoConfirmar="Sí, eliminar" />
        </section>
      </div>
    </div>
  );
}
