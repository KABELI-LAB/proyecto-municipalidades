import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EtiquetaEstado } from "@/componentes/EtiquetaEstado";
import { FotoAnimal } from "@/componentes/portal/FotoAnimal";
import { fotosDeFicha } from "@/componentes/portal/fotoFicha";
import { SiNo } from "@/componentes/portal/TarjetaAdopcion";
import { ESPECIE, ESTADO_ADOPCION, oracion, SEXO, TAMANO, textoEdad } from "@/dominio/etiquetas";
import { fichaAdopcion, territorio } from "@/servidor/portal/consultas";
import estilos from "@/estilos/paginas.module.css";
import { FormularioPostulacion } from "./FormularioPostulacion";

export const metadata: Metadata = { title: "Ficha de adopción" };

/** «Convive con niños y con otros animales», a partir de los dos datos sí/no de la ficha. */
function textoConvivencia(f: { conviveConNinos: boolean | null; conviveConAnimales: boolean | null }): string {
  const parte = (v: boolean | null, que: string) => (v === null ? null : v ? `convive con ${que}` : `no convive con ${que}`);
  const partes = [parte(f.conviveConNinos, "niños"), parte(f.conviveConAnimales, "otros animales")].filter(Boolean) as string[];
  if (partes.length === 0) return "";
  const texto = partes.join(" y ");
  return `${texto.charAt(0).toUpperCase()}${texto.slice(1)}.`;
}

export default async function PaginaFicha({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [f, lista] = await Promise.all([fichaAdopcion(id), territorio()]);
  if (!f) notFound();
  const a = f.animal;
  const nombre = a.nombre ?? "Sin nombre";
  const [principal, ...otras] = fotosDeFicha(f);

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <EtiquetaEstado estado={ESTADO_ADOPCION[f.estado]} />
        <h1>{nombre}</h1>
        {f.caracter && <p className={estilos.textoLibre}>{oracion(f.caracter)}</p>}
      </div>

      <div className={estilos.grillaDos}>
        <section className={estilos.panel} aria-labelledby="ficha">
          <FotoAnimal foto={a.foto} alt={nombre} subida={principal?.subida ? principal : undefined} />
          {otras.length > 0 && (
            <ul className={estilos.galeriaChica} aria-label={`Otras fotos de ${nombre}`}>
              {otras.map((o, i) => (
                <li key={o.src}>
                  <FotoAnimal foto={null} alt={`${nombre}, foto ${i + 2}`} subida={o} />
                </li>
              ))}
            </ul>
          )}
          <h2 id="ficha">Ficha</h2>
          <dl className={estilos.datos}>
            <dt>Especie</dt>
            <dd>{ESPECIE[a.especie]}</dd>
            <dt>Sexo</dt>
            <dd>{SEXO[a.sexo]}</dd>
            <dt>Edad</dt>
            <dd>{textoEdad(a.edadAproxMeses)}</dd>
            {a.especie === "PERRO" && (
              <>
                <dt>Tamaño</dt>
                <dd>{a.tamano ? TAMANO[a.tamano] : "No informado"}</dd>
              </>
            )}
            <dt>Esterilización</dt>
            <dd>
              <SiNo valor={a.esterilizado} />
            </dd>
            <dt>Vacunas al día</dt>
            <dd>
              <SiNo valor={a.vacunasAlDia} />
            </dd>
            <dt>Microchip</dt>
            <dd>
              <SiNo valor={a.microchip} />
            </dd>
            {textoConvivencia(f) && (
              <>
                <dt>Convivencia</dt>
                <dd>{textoConvivencia(f)}</dd>
              </>
            )}
            {f.sector && (
              <>
                <dt>Sector</dt>
                <dd>{f.sector.nombre}</dd>
              </>
            )}
            {f.saludTexto && (
              <>
                <dt>Salud</dt>
                <dd>{f.saludTexto}</dd>
              </>
            )}
            {f.hogarTexto && (
              <>
                <dt>Qué hogar busca</dt>
                <dd>{f.hogarTexto}</dd>
              </>
            )}
          </dl>
          {f.proponenteId && (
            <p className="nota">
              Lo da en adopción un vecino; el municipio revisó la ficha antes de publicarla. Su postulación le llega a esa persona, y solo si le elige se comparten
              los contactos de ambos.
            </p>
          )}
        </section>

        <section className={estilos.seccion} aria-labelledby="postular">
          <h2 id="postular">Postular para adoptar a {nombre}</h2>
          <FormularioPostulacion fichaId={f.id} nombre={nombre} convivencia={textoConvivencia(f)} sectores={lista} deVecino={Boolean(f.proponenteId)} />
        </section>
      </div>
    </div>
  );
}
