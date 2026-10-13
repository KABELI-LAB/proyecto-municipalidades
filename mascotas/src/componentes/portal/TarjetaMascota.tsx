import Link from "next/link";
import { Icono } from "@/componentes/Icono";
import { ESPECIE, especieConSexo, TAMANO, TIPO_PUBLICACION, tipoAviso, tituloAviso } from "@/dominio/etiquetas";
import { fechaCorta } from "@/servidor/formato";
import { FotoAnimal } from "./FotoAnimal";
import { fotoDeAviso } from "./fotoAviso";
import estilos from "./tarjetas.module.css";

type Props = {
  publicacion: {
    id: string;
    tipo: string;
    especie: string;
    sexo: string | null;
    tamano: string | null;
    colorPrincipal: string;
    nombreAnimal: string | null;
    collar: string | null;
    colorCollar: string | null;
    senas: string | null;
    fechaEvento: Date;
    sector: { nombre: string };
    localidad?: { nombre: string } | null;
    fotoUrl?: string | null;
    animal?: { foto: string | null } | null;
  };
  /** La plataforma encontró un aviso opuesto que podría ser el mismo animal. */
  coincidencia?: boolean;
};

/** Solo datos públicos: rasgos del animal, sector y fecha. Nunca datos de contacto. */
export function TarjetaMascota({ publicacion: p, coincidencia = false }: Props) {
  const perdida = p.tipo === "PERDIDA";
  return (
    <article className={estilos.tarjeta}>
      <FotoAnimal foto={null} alt={`${ESPECIE[p.especie]} ${p.colorPrincipal}`} subida={fotoDeAviso(p) ?? undefined} />
      <p className={`${estilos.tipoMascota} ${perdida ? estilos.perdida : estilos.encontrada}`}>
        <Icono nombre={perdida ? "buscar" : "huella"} tamano={18} />
        {tipoAviso(p.tipo, p.sexo)}
      </p>
      {coincidencia && (
        <p className={estilos.coincidencia}>
          <Icono nombre="buscar" tamano={18} />
          Posible coincidencia: revise el aviso
        </p>
      )}
      <h3>
        <Link href={`/mascotas/${p.id}`} className={estilos.enlaceTitulo}>
          {tituloAviso(p)}
        </Link>
      </h3>
      <p>
        {p.nombreAnimal?.trim() ? `${especieConSexo(p.especie, p.sexo)} ${p.colorPrincipal}` : especieConSexo(p.especie, p.sexo)}
        {p.tamano ? `, ${TAMANO[p.tamano].toLowerCase()}` : ""}.
      </p>
      {p.collar === "SI" && <p>Con collar{p.colorCollar ? ` ${p.colorCollar}` : ""}.</p>}
      {p.senas && <p className={estilos.senas}>{p.senas}</p>}
      <p className={estilos.lugar}>
        <Icono nombre="ubicacion" tamano={20} />
        {p.localidad ? `${p.localidad.nombre}, ${p.sector.nombre}` : p.sector.nombre} · {perdida ? "se perdió" : "se vio"} el {fechaCorta(p.fechaEvento)}
      </p>
    </article>
  );
}
