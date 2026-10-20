import type { Metadata } from "next";
import Link from "next/link";
import { EtiquetaEstado } from "@/componentes/EtiquetaEstado";
import { BotonAccion } from "@/componentes/panel/BotonAccion";
import { TIPO_AVISO } from "@/dominio/etiquetas";
import { requerir } from "@/servidor/auth";
import { diaISO, fechaCorta } from "@/servidor/formato";
import { eliminarAviso, publicarAviso } from "@/servidor/panel/acciones-avisos";
import { avisosPanel } from "@/servidor/panel/avisos";
import estilos from "@/estilos/paginas.module.css";
import propios from "./avisos.module.css";
import { NuevoAviso } from "./NuevoAviso";

export const metadata: Metadata = { title: "Avisos a vecinos · Panel municipal" };

// Responde: ¿qué les estamos diciendo a los vecinos? Crear, editar y eliminar.
export default async function AvisosPanel() {
  await requerir("gestionarAvisos");
  const [publicados, borradores] = await Promise.all([avisosPanel("vigentes"), avisosPanel("borradores")]);
  const lista = [...borradores, ...publicados];
  const manana = diaISO(new Date(Date.now() + 14 * 86_400_000));

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <h1>Avisos a vecinos</h1>
        <p>Se muestran en el portal hasta la fecha que indiques.</p>
      </div>

      <NuevoAviso hastaSugerido={manana} />

      {lista.length === 0 ? (
        <div className={estilos.vacio}>
          <p>No hay avisos vigentes.</p>
        </div>
      ) : (
        <ul className={estilos.listaFilas}>
          {lista.map((a) => (
            <li key={a.id}>
              <div>
                <Link href={`/panel/avisos/${a.id}`}>
                  <b>{a.titulo}</b>
                </Link>
                <span>
                  {TIPO_AVISO[a.tipo]} · hasta el {fechaCorta(a.vigenteHasta)}
                </span>
              </div>
              <div className={propios.acciones}>
                <EtiquetaEstado estado={a.estado === "BORRADOR" ? { texto: "Borrador", tono: "recibido" } : { texto: "En el portal", tono: "confirmado" }} />
                {a.estado === "BORRADOR" && <BotonAccion accion={publicarAviso.bind(null, a.id)} texto="Publicar" variante="primario" />}
                <BotonAccion accion={eliminarAviso.bind(null, a.id)} texto="Eliminar" confirmar={`«${a.titulo}» dejará de verse y se eliminará. ¿Quieres eliminarlo?`} textoConfirmar="Sí, eliminar" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
