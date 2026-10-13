// Datos de una publicación de mascota para las bandejas del panel.
import { EtiquetaEstado } from "@/componentes/EtiquetaEstado";
import { FotoAnimal } from "@/componentes/portal/FotoAnimal";
import { fotoDeAviso } from "@/componentes/portal/fotoAviso";
import { ESPECIE, especieConSexo, MODERACION, SEXO, TAMANO, textoResguardo, TIPO_PUBLICACION, tipoAviso, tituloAviso } from "@/dominio/etiquetas";
import { fechaCorta } from "@/servidor/formato";
import estilos from "@/estilos/paginas.module.css";

export type PublicacionBandeja = {
  id: string;
  fotoUrl?: string | null;
  codigo: string | null;
  tipo: string;
  especie: string;
  sexo: string;
  tamano: string | null;
  colorPrincipal: string;
  nombreAnimal: string | null;
  collar: string | null;
  colorCollar: string | null;
  microchip?: string | null;
  senas: string | null;
  fechaEvento: Date;
  moderacion: string;
  resguardada: boolean | null;
  resguardo?: string | null;
  resguardoDetalle?: string | null;
  resguardoLocalidad?: { nombre: string; sector: { nombre: string } } | null;
  sector: { nombre: string };
  localidad: { nombre: string } | null;
  animal: { foto: string | null } | null;
  _count: { mensajes: number };
};

/** `plegado`: una línea de resumen y los datos bajo «Más detalles» (tarjetas compactas de «Por aprobar»). */
export function ResumenPublicacion({ p, conModeracion = true, Titulo = "h2", plegado = false }: { p: PublicacionBandeja; conModeracion?: boolean; Titulo?: "h2" | "h3"; plegado?: boolean }) {
  const perdida = p.tipo === "PERDIDA";
  return (
    <>
      <FotoAnimal foto={null} alt={`${ESPECIE[p.especie]} ${p.colorPrincipal}`} subida={fotoDeAviso(p) ?? undefined} />
      {conModeracion && <EtiquetaEstado estado={MODERACION[p.moderacion]} />}
      <Titulo>
        {tipoAviso(p.tipo, p.sexo)}: {tituloAviso(p)}
      </Titulo>
      {plegado ? (
        <>
          <p>
            {especieConSexo(p.especie, p.sexo)} {p.colorPrincipal} · {p.localidad ? `${p.localidad.nombre}, ${p.sector.nombre}` : p.sector.nombre} · {perdida ? "se perdió" : "se vio"} el {fechaCorta(p.fechaEvento)}
          </p>
          <details className={estilos.masDetalles}>
            <summary>Más detalles</summary>
          <dl className={estilos.datos}>
            <dt>Sexo y tamaño</dt>
            <dd>{[SEXO[p.sexo], p.tamano ? TAMANO[p.tamano].toLowerCase() : null].filter(Boolean).join(", ")}</dd>
            <dt>Collar</dt>
            <dd>{p.collar === "SI" ? `Sí${p.colorCollar ? `, ${p.colorCollar}` : ""}` : p.collar === "NO" ? "No" : "No se sabe"}</dd>
            {perdida && p.microchip && (
              <>
                <dt>Microchip</dt>
                <dd>{p.microchip === "SI" ? "Sí" : p.microchip === "NO" ? "No" : "No sabe"}</dd>
              </>
            )}
            {p.nombreAnimal && (
              <>
                <dt>Responde a</dt>
                <dd>{p.nombreAnimal}</dd>
              </>
            )}
            {p.senas && (
              <>
                <dt>Señas</dt>
                <dd>{p.senas}</dd>
              </>
            )}
            {!perdida && p.resguardada !== null && (
              <>
                <dt>Dónde está ahora</dt>
                <dd>{textoResguardo(p)}</dd>
              </>
            )}
            <dt>Mensajes recibidos</dt>
            <dd>{p._count.mensajes}</dd>
          </dl>
          {p.codigo && <p className="nota">Código {p.codigo}</p>}
          </details>
        </>
      ) : (
        <>
        {p.nombreAnimal?.trim() && (
          <p>
            {especieConSexo(p.especie, p.sexo)} {p.colorPrincipal}
          </p>
        )}
        <p>
          {p.localidad ? `${p.localidad.nombre}, ${p.sector.nombre}` : p.sector.nombre} · {perdida ? "se perdió" : "se vio"} el {fechaCorta(p.fechaEvento)}
        </p>
        <dl className={estilos.datos}>
          <dt>Sexo y tamaño</dt>
          <dd>{[SEXO[p.sexo], p.tamano ? TAMANO[p.tamano].toLowerCase() : null].filter(Boolean).join(", ")}</dd>
          <dt>Collar</dt>
          <dd>{p.collar === "SI" ? `Sí${p.colorCollar ? `, ${p.colorCollar}` : ""}` : p.collar === "NO" ? "No" : "No se sabe"}</dd>
          {perdida && p.microchip && (
            <>
              <dt>Microchip</dt>
              <dd>{p.microchip === "SI" ? "Sí" : p.microchip === "NO" ? "No" : "No sabe"}</dd>
            </>
          )}
          {p.nombreAnimal && (
            <>
              <dt>Responde a</dt>
              <dd>{p.nombreAnimal}</dd>
            </>
          )}
          {p.senas && (
            <>
              <dt>Señas</dt>
              <dd>{p.senas}</dd>
            </>
          )}
          {!perdida && p.resguardada !== null && (
            <>
              <dt>Dónde está ahora</dt>
              <dd>{textoResguardo(p)}</dd>
            </>
          )}
          <dt>Mensajes recibidos</dt>
          <dd>{p._count.mensajes}</dd>
        </dl>
        {p.codigo && <p className="nota">Código {p.codigo}</p>}
        </>
      )}
    </>
  );
}
