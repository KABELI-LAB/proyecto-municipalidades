import type { Metadata } from "next";
import Link from "next/link";
import { EtiquetaEstado } from "@/componentes/EtiquetaEstado";
import { AccionConMotivo } from "@/componentes/panel/AccionConMotivo";
import { BotonAccion } from "@/componentes/panel/BotonAccion";
import { EstadoInstagram } from "@/componentes/panel/EstadoInstagram";
import { fotosDeFicha } from "@/componentes/portal/fotoFicha";
import { ConIcono, SiNo } from "@/componentes/portal/TarjetaAdopcion";
import { ESPECIE, ESTADO_ADOPCION, RELACION_ANIMAL, REVISION_ADOPCION, SEXO, TAMANO, textoEdad } from "@/dominio/etiquetas";
import { requerir } from "@/servidor/auth";
import { fechaCorta, haceDias } from "@/servidor/formato";
import { aprobarPropuesta, ocultarFichaAdopcion, pedirCorrecciones, rechazarPropuesta, volverAPublicarFicha } from "@/servidor/panel/acciones-bandejas";
import { contarPropuestas, propuestasBandeja, type GrupoPropuestas } from "@/servidor/panel/bandejas";
import { estadoIntegracion } from "@/servidor/redes/instagram";
import { estadosInstagram } from "@/servidor/redes/servicio";
import estilos from "@/estilos/paginas.module.css";
import propios from "./propuestas.module.css";

export const metadata: Metadata = { title: "Propuestas de adopción · Panel municipal" };

const CIERRE: Record<string, string> = { ENCONTRO_HOGAR: "Quien la propuso avisó que encontró hogar.", YA_NO_APLICA: "Quien la propuso la retiró." };

// Responde: ¿qué propuestas de «Dar en adopción» hay que revisar antes de publicarlas?
export default async function PropuestasPanel({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  await requerir("gestionarAdopciones");
  const { ver } = await searchParams;
  const grupo: GrupoPropuestas = ver === "correcciones" || ver === "publicadas" || ver === "cerradas" ? ver : "pendientes";
  const [lista, cuenta] = await Promise.all([propuestasBandeja(grupo), contarPropuestas()]);
  const instagram = await estadosInstagram("ADOPCION", lista.filter((f) => f.revision === "APROBADA").map((f) => f.id));
  const configurada = estadoIntegracion().configurada;
  const pestanas: { clave: GrupoPropuestas; texto: string }[] = [
    { clave: "pendientes", texto: `Por revisar (${cuenta.pendientes})` },
    { clave: "correcciones", texto: `Esperan correcciones (${cuenta.correcciones})` },
    { clave: "publicadas", texto: `Publicadas (${cuenta.publicadas})` },
    { clave: "cerradas", texto: `Cerradas (${cuenta.cerradas})` },
  ];

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <h1>Propuestas de adopción</h1>
        <p>Animales que las vecinas y vecinos proponen dar en adopción. Nada se publica sin tu revisión.</p>
      </div>

      <nav aria-label="Estado de las propuestas" className={estilos.pestanas}>
        {pestanas.map((p) => (
          <Link key={p.clave} href={`/panel/propuestas?ver=${p.clave}`} aria-current={p.clave === grupo ? "page" : undefined} replace>
            {p.texto}
          </Link>
        ))}
      </nav>

      {lista.length === 0 ? (
        <div className={estilos.vacio}>
          <p>No hay propuestas en esta bandeja.</p>
        </div>
      ) : (
        <div className={estilos.grilla}>
          {lista.map((f) => {
            const a = f.animal;
            const nombre = a.nombre ?? `${ESPECIE[a.especie]} sin nombre`;
            const fotos = fotosDeFicha(f);
            const estado = f.revision === "APROBADA" ? ESTADO_ADOPCION[f.estado] : REVISION_ADOPCION[f.revision];
            return (
              <article key={f.id} className={estilos.panel}>
                <EtiquetaEstado estado={estado} />
                <h2>{nombre}</h2>
                <p>
                  {f.proponente ? "Propuesta por un vecino" : "Ficha del municipio"} · {fechaCorta(f.creadaEn)} ({haceDias(f.creadaEn)})
                  {f._count.postulaciones > 0 && ` · ${f._count.postulaciones === 1 ? "1 postulación" : `${f._count.postulaciones} postulaciones`}`}
                </p>
                {fotos.length > 0 && (
                  <ul className={propios.fotos} aria-label={`Fotos de ${nombre}`}>
                    {fotos.map((x, i) => (
                      <li key={x.src}>
                        <a href={x.src} target="_blank" rel="noopener">
                          {/* Fotos en revisión: se entregan con permiso, sin el optimizador público. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={x.src} alt={`${nombre}, foto ${i + 1}`} loading="lazy" />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                <dl className={estilos.datos}>
                  <dt>Animal</dt>
                  <dd>{[ESPECIE[a.especie], SEXO[a.sexo].toLowerCase(), a.tamano ? TAMANO[a.tamano].toLowerCase() : "tamaño no informado", textoEdad(a.edadAproxMeses).toLowerCase()].join(" · ")}</dd>
                  <dt>Esterilizado</dt>
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
                  {f.saludTexto && (
                    <>
                      <dt>Salud</dt>
                      <dd>{f.saludTexto}</dd>
                    </>
                  )}
                  <dt>Sobre el animal</dt>
                  <dd style={{ whiteSpace: "pre-line" }}>{f.caracter ?? "[sin dato]"}</dd>
                  {(f.conviveConNinos !== null || f.conviveConAnimales !== null) && (
                    <>
                      <dt>Con niños / animales</dt>
                      <dd>
                        <SiNo valor={f.conviveConNinos} /> / <SiNo valor={f.conviveConAnimales} />
                      </dd>
                    </>
                  )}
                  {f.hogarTexto && (
                    <>
                      <dt>Hogar que busca</dt>
                      <dd>{f.hogarTexto}</dd>
                    </>
                  )}
                  {f.sector && (
                    <>
                      <dt>Dónde está</dt>
                      <dd>{f.localidad ? `${f.localidad.nombre}, ${f.sector.nombre}` : f.sector.nombre}</dd>
                    </>
                  )}
                  {f.proponente && (
                    <>
                      <dt>Quien propone</dt>
                      <dd>
                        {f.proponente.nombre} · {f.relacion ? RELACION_ANIMAL[f.relacion].toLowerCase() : "[relación sin dato]"}
                      </dd>
                      <dt>Contacto</dt>
                      <dd>{[f.proponente.telefono, f.proponente.correo].filter(Boolean).join(" · ") || "[sin contacto]"}</dd>
                      <dt>Autorización</dt>
                      <dd><ConIcono si={f.autorizaPublicar} texto={f.autorizaPublicar ? "Declaró que puede darlo en adopción" : "Sin declaración"} /></dd>
                    </>
                  )}
                </dl>
                {f.motivoRevision && (
                  <p className={propios.motivo}>
                    <b>Motivo comunicado:</b> {f.motivoRevision}
                    {f.revisadoPor && f.revisadaEn && ` (${f.revisadoPor.nombre}, ${fechaCorta(f.revisadaEn)})`}
                  </p>
                )}
                {f.cierre && <p>{CIERRE[f.cierre]}</p>}
                {f.codigo && <p className="nota">Código {f.codigo}</p>}
                <div className={estilos.accionesCabecera}>
                  {f.revision === "PENDIENTE" && (
                    <>
                      <BotonAccion
                        accion={aprobarPropuesta.bind(null, f.id)}
                        texto="Aprobar y publicar"
                        variante="primario"
                        confirmar={`La ficha de ${nombre} se publicará en el catálogo de adopción con sus fotos. ¿Revisaste que las fotos y los datos sean adecuados?`}
                        textoConfirmar="Sí, publicar"
                      />
                      <AccionConMotivo accion={pedirCorrecciones.bind(null, f.id)} texto="Pedir correcciones" pregunta="¿Qué debe corregir quien propuso?" textoConfirmar="Pedir correcciones" />
                    </>
                  )}
                  {(f.revision === "PENDIENTE" || f.revision === "CORRECCIONES") && (
                    <AccionConMotivo accion={rechazarPropuesta.bind(null, f.id)} texto="No publicar" pregunta="¿Por qué no se publicará?" textoConfirmar="No publicar" />
                  )}
                  {f.revision === "APROBADA" && f.estado === "DISPONIBLE" && (
                    <AccionConMotivo accion={ocultarFichaAdopcion.bind(null, f.id)} texto="Ocultar del catálogo" pregunta="¿Por qué se retira del catálogo?" textoConfirmar="Ocultar" />
                  )}
                  {f.revision === "OCULTA" && <BotonAccion accion={volverAPublicarFicha.bind(null, f.id)} texto="Volver a publicar" variante="primario" />}
                </div>
                {f.revision === "APROBADA" && f.estado === "DISPONIBLE" && <EstadoInstagram tipo="ADOPCION" id={f.id} estado={instagram[f.id]} configurada={configurada} />}
              </article>
            );
          })}
        </div>
      )}
      <p className="nota">
        El contacto de quien propone solo se ve aquí. Las postulaciones le llegan directo a esa persona, que elige; los contactos se comparten solo entre
        ella y la persona elegida.
      </p>
    </div>
  );
}
