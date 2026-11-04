// Estado en Instagram de un contenido ya publicado en la web, en su propia
// tarjeta del panel: enlace si salió, el error y «Reintentar» si falló, o
// «Publicar en Instagram» para contenido anterior a la integración.
import type { TipoRed } from "@/dominio/redes";
import { publicarEnInstagram } from "@/servidor/panel/acciones-redes";
import type { EstadoInstagram as Estado } from "@/servidor/redes/servicio";
import { BotonAccion } from "./BotonAccion";

type Props = { tipo: TipoRed; id: string; estado?: Estado; configurada: boolean };

export function EstadoInstagram({ tipo, id, estado, configurada }: Props) {
  if (estado?.estado === "PUBLICADO") {
    return (
      <p>
        <b>Instagram:</b> publicado.{" "}
        {estado.permalink && (
          <a href={estado.permalink} target="_blank" rel="noopener noreferrer">
            Ver en Instagram
          </a>
        )}
      </p>
    );
  }
  if (!configurada) return <p className="nota">Instagram no está configurado: solo se publica en la web.</p>;
  const fallo = estado?.estado === "ERROR";
  return (
    <div>
      {fallo && (
        <p>
          <b>Instagram:</b> no se pudo publicar. {estado?.error}
        </p>
      )}
      <BotonAccion accion={publicarEnInstagram.bind(null, tipo, id)} texto={fallo ? "Reintentar en Instagram" : "Publicar en Instagram"} />
    </div>
  );
}
