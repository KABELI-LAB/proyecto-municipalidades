import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnlaceBoton } from "@/componentes/Boton";
import { EtiquetaEstado } from "@/componentes/EtiquetaEstado";
import { FotoAnimal } from "@/componentes/portal/FotoAnimal";
import { fotoDeComunitario } from "@/componentes/portal/fotoComunitario";
import { REPORTE_COMUNITARIO } from "@/componentes/portal/TarjetaComunitario";
import { SiNo } from "@/componentes/portal/TarjetaAdopcion";
import { estadoActualizacion } from "@/dominio/comunitarios";
import { SEXO, TAMANO, textoEdad } from "@/dominio/etiquetas";
import { fechaLarga } from "@/servidor/formato";
import { perroComunitario, seguimientoComunitario } from "@/servidor/portal/consultas";
import estilos from "@/estilos/paginas.module.css";

export const metadata: Metadata = { title: "Perro comunitario" };

const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

// Ficha oficial: la registra y valida el municipio. Las novedades de vecinos y
// cuidadores no la cambian solas: el equipo las revisa primero.
export default async function PaginaComunitario({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [c, seguimiento] = await Promise.all([perroComunitario(id), seguimientoComunitario(id)]);
  if (!c || !seguimiento) notFound();
  const a = c.animal;
  const titulo = a.nombre ?? capitalizar(c.apodo);
  const estado = estadoActualizacion(seguimiento.ultimoControl);
  const foto = fotoDeComunitario(c);

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.grillaDos}>
        <FotoAnimal foto={null} alt={`${titulo}, perro comunitario`} subida={foto ?? undefined} />
        <section className={estilos.seccion} aria-labelledby="titulo">
          <h1 id="titulo">{titulo}</h1>
          {a.nombre && <p>{capitalizar(c.apodo)}</p>}
          <dl className={estilos.datos}>
            <dt>Lugar de referencia</dt>
            <dd>
              {c.lugar.nombre}, {c.lugar.localidad.nombre} (sector {c.sector.nombre})
            </dd>
            <dt>Sexo</dt>
            <dd>{SEXO[a.sexo]}</dd>
            {a.tamano && (
              <>
                <dt>Tamaño</dt>
                <dd>{TAMANO[a.tamano]}</dd>
              </>
            )}
            {a.colorPrincipal && (
              <>
                <dt>Color</dt>
                <dd>{capitalizar(a.colorPrincipal)}</dd>
              </>
            )}
            <dt>Edad aproximada</dt>
            <dd>{textoEdad(a.edadAproxMeses)}</dd>
            {a.rasgos && a.rasgos !== "sin rasgos visibles" && (
              <>
                <dt>Seña particular</dt>
                <dd>{capitalizar(a.rasgos)}</dd>
              </>
            )}
            <dt>Esterilizado</dt>
            <dd>
              <SiNo valor={a.esterilizado} />
            </dd>
            <dt>Vacunas al día</dt>
            <dd>
              <SiNo valor={a.vacunasAlDia} />
            </dd>
          </dl>
          <div>
            {seguimiento.conCuidador ? (
              <div className={estilos.accionesCabecera}>
                <EnlaceBoton href={`/comunitarios/${c.id}/novedad`}>Informar una novedad</EnlaceBoton>
                <EnlaceBoton href={`/comunitarios/${c.id}/actualizar`} variante="secundario">
                  Soy su cuidador: actualizar
                </EnlaceBoton>
              </div>
            ) : (
              <EnlaceBoton href={`/comunitarios/${c.id}/cuidar`}>Hacerme cargo</EnlaceBoton>
            )}
          </div>
          {!seguimiento.conCuidador && <p className="nota">Aún no tiene un vecino a cargo. Si usted lo cuida, puede quedar como su cuidador.</p>}
          <p className="nota">
            ¿Está herido y es urgente? Use <Link href={REPORTE_COMUNITARIO}>SOS Mascotas</Link>.
          </p>
        </section>
      </div>

      <div className={estilos.grillaDos}>
        <section className={estilos.panel} aria-labelledby="seguimiento">
          <h2 id="seguimiento">Seguimiento</h2>
          <EtiquetaEstado estado={estado} />
          <dl className={estilos.datos}>
            <dt>Última revisión en terreno</dt>
            <dd>{seguimiento.ultimoControl ? fechaLarga(seguimiento.ultimoControl) : "Sin revisión registrada"}</dd>
            <dt>Datos de la ficha</dt>
            <dd>{seguimiento.fichaRevisadaEn ? `Actualizados el ${fechaLarga(seguimiento.fichaRevisadaEn)}` : "Sin actualizaciones en la plataforma"}</dd>
            <dt>Cuidador</dt>
            <dd>{seguimiento.conCuidador ? "Tiene un vecino a cargo que mantiene esta ficha" : "Aún sin un vecino a cargo"}</dd>
          </dl>
          <p className="nota">La ficha la mantiene la comunidad: muestra lo registrado, no cómo está hoy. No publicamos quiénes lo cuidan.</p>
        </section>

        <section className={estilos.panel} aria-labelledby="historial">
          <h2 id="historial">Historial de atenciones</h2>
          {seguimiento.historial.length ? (
            <ul className={estilos.listaSimple}>
              {seguimiento.historial.map((h) => (
                <li key={h.clave}>
                  <b>{h.texto}</b> · {fechaLarga(h.fecha)}
                </li>
              ))}
            </ul>
          ) : (
            <p>Aún no hay controles ni atenciones registrados en la plataforma.</p>
          )}
        </section>
      </div>
    </div>
  );
}
