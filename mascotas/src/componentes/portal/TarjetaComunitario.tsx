import Link from "next/link";
import { Icono } from "@/componentes/Icono";
import { SEXO, TAMANO } from "@/dominio/etiquetas";
import { FotoAnimal } from "./FotoAnimal";
import estilos from "./tarjetas.module.css";

type Props = {
  perro: {
    id: string;
    apodo: string;
    foto: { src: string; subida: boolean } | null;
    lugar: { nombre: string };
    sector: { nombre: string };
    animal: { nombre: string | null; sexo: string; tamano: string | null; colorPrincipal: string | null };
  };
};

/** Reporte con el tipo ya elegido (clave de demo/datos/catalogos.json). */
export const REPORTE_COMUNITARIO = `/reportar?tipo=${encodeURIComponent("animal comunitario sin atencion")}`;

const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export function TarjetaComunitario({ perro: c }: Props) {
  const a = c.animal;
  const titulo = a.nombre ?? capitalizar(c.apodo);
  return (
    <article className={estilos.tarjeta}>
      <FotoAnimal foto={null} alt={`${titulo}, perro comunitario`} subida={c.foto ?? undefined} />
      <h3>
        <Link href={`/comunitarios/${c.id}`} className={estilos.enlaceTitulo}>
          {titulo}
        </Link>
      </h3>
      {a.nombre && <p>{capitalizar(c.apodo)}</p>}
      <p className={estilos.lugar}>
        <Icono nombre="ubicacion" tamano={20} />
        {c.lugar.nombre} · {c.sector.nombre}
      </p>
      <p>{[SEXO[a.sexo], a.tamano ? TAMANO[a.tamano].toLowerCase() : null, a.colorPrincipal].filter(Boolean).join(" · ")}</p>
    </article>
  );
}
