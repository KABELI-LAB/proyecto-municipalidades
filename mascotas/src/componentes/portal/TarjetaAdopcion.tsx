import Link from "next/link";
import { EtiquetaEstado } from "@/componentes/EtiquetaEstado";
import { Icono } from "@/componentes/Icono";
import { ESPECIE, ESTADO_ADOPCION, oracion, SEXO, TAMANO, textoEdad } from "@/dominio/etiquetas";
import { FotoAnimal } from "./FotoAnimal";
import { fotosDeFicha } from "./fotoFicha";
import estilos from "./tarjetas.module.css";

type Props = {
  ficha: {
    id: string;
    estado: string;
    caracter: string | null;
    fotos: string;
    animal: { nombre: string | null; especie: string; sexo: string; edadAproxMeses: number | null; tamano: string | null; foto: string | null };
  };
};

export function TarjetaAdopcion({ ficha: f }: Props) {
  const a = f.animal;
  return (
    <article className={estilos.tarjeta}>
      <FotoAnimal foto={a.foto} alt={a.nombre ?? ESPECIE[a.especie]} subida={a.foto ? undefined : fotosDeFicha(f)[0]} />
      <EtiquetaEstado estado={ESTADO_ADOPCION[f.estado]} />
      <h3>
        <Link href={`/adoptar/${f.id}`} className={estilos.enlaceTitulo}>
          {a.nombre ?? "Sin nombre"}
        </Link>
      </h3>
      <p>
        {[ESPECIE[a.especie], SEXO[a.sexo].toLowerCase(), a.especie === "PERRO" && a.tamano ? TAMANO[a.tamano].toLowerCase() : null, textoEdad(a.edadAproxMeses).toLowerCase()]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {/* En la tarjeta, solo el comienzo del texto; completo en la ficha. */}
      {f.caracter && <p className={estilos.resumenTexto}>{oracion(f.caracter)}</p>}
    </article>
  );
}

/** Sí / No con su ícono, siempre con la palabra. */
export function SiNo({ valor }: { valor: boolean | null }) {
  if (valor === null) return <>No informado</>;
  return <ConIcono si={valor} texto={valor ? "Sí" : "No"} />;
}

/** Ícono de visto o de cruz junto a un texto (nunca el ícono solo). */
export function ConIcono({ si, texto }: { si: boolean; texto: string }) {
  return (
    <span className={estilos.conIcono}>
      <Icono nombre={si ? "check" : "cerrar"} tamano={16} />
      {texto}
    </span>
  );
}
