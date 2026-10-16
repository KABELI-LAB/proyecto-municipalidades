import type { Metadata } from "next";
import { AccionConMotivo } from "@/componentes/panel/AccionConMotivo";
import { BotonAccion } from "@/componentes/panel/BotonAccion";
import { ResumenPublicacion } from "@/componentes/panel/ResumenPublicacion";
import { fotosDeFicha } from "@/componentes/portal/fotoFicha";
import { ConIcono, SiNo } from "@/componentes/portal/TarjetaAdopcion";
import { ESPECIE, RELACION_ANIMAL, SEXO, TAMANO, textoEdad } from "@/dominio/etiquetas";
import { puede } from "@/dominio/permisos";
import { requerir } from "@/servidor/auth";
import { fechaCorta, haceDias } from "@/servidor/formato";
import { aprobarPropuesta, aprobarPublicacion, ocultarPublicacion, pedirCorrecciones, rechazarPropuesta } from "@/servidor/panel/acciones-bandejas";
import { propuestasBandeja, publicacionesBandeja } from "@/servidor/panel/bandejas";
import estilos from "@/estilos/paginas.module.css";
import propios from "./aprobar.module.css";

export const metadata: Metadata = { title: "Por aprobar · Panel municipal" };

// Responde: ¿qué enviaron los vecinos que hay que aprobar? Al aprobar, se
// publica en el portal (y en Instagram); al no publicar, se avisa a quien lo envió.
export default async function PorAprobar() {
  const usuario = await requerir();
  const avisos = puede(usuario.rol, "moderarPublicaciones");
  const adopciones = puede(usuario.rol, "gestionarAdopciones");
  const [publicaciones, propuestas] = await Promise.all([avisos ? publicacionesBandeja("pendientes") : Promise.resolve([]), adopciones ? propuestasBandeja("pendientes") : Promise.resolve([])]);
  const vacio = publicaciones.length === 0 && propuestas.length === 0;

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      {/* Título y nota en una fila, para que las tarjetas queden a la vista. */}
      <div className={propios.cabecera}>
        <h1>Por aprobar</h1>
        <p className="nota">Al aprobar, se publica en el portal y en Instagram.</p>
      </div>

      {vacio && (
        <div className={estilos.vacio}>
          <p>No hay nada por aprobar. Buen trabajo.</p>
        </div>
      )}

      {publicaciones.length > 0 && (
        <section className={`${estilos.seccion} ${propios.grupo}`} aria-labelledby="perdidos">
          <h2 id="perdidos">Perdidos y avistados ({publicaciones.length})</h2>
          <div className={propios.lista}>
            {publicaciones.map((p) => (
              <article key={p.id} className={`${estilos.panel} ${propios.tarjeta}`}>
                <ResumenPublicacion p={p} conModeracion={false} Titulo="h3" plegado />
                <div className={propios.acciones}>
                  <BotonAccion accion={aprobarPublicacion.bind(null, p.id)} texto="Aprobar y publicar" variante="primario" />
                  <BotonAccion accion={ocultarPublicacion.bind(null, p.id)} texto="No publicar" confirmar="El aviso no se publicará y avisaremos a quien lo envió. ¿Quieres continuar?" textoConfirmar="Sí, no publicar" />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {propuestas.length > 0 && (
        <section className={`${estilos.seccion} ${propios.grupo}`} aria-labelledby="adopciones">
          <h2 id="adopciones">Adopciones ({propuestas.length})</h2>
          <div className={propios.lista}>
            {propuestas.map((f) => {
              const a = f.animal;
              const nombre = a.nombre ?? `${ESPECIE[a.especie]} sin nombre`;
              const fotos = fotosDeFicha(f);
              return (
                <article key={f.id} className={`${estilos.panel} ${propios.tarjeta}`}>
                  {/* Todas las fotos que envió (hasta 3); al tocar una se abre en grande. */}
                  <ul className={propios.fotos} aria-label={`Fotos de ${nombre}`}>
                    {fotos.map((x, i) => (
                      <li key={x.src}>
                        <a href={x.src} target="_blank" rel="noopener">
                          {/* Fotos en revisión: se entregan con permiso, sin el optimizador público. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={x.src} alt={`${nombre}, foto ${i + 1} de ${fotos.length}`} loading="lazy" />
                        </a>
                      </li>
                    ))}
                  </ul>
                  <h3>{nombre}</h3>
                  <p>
                    {[ESPECIE[a.especie], SEXO[a.sexo].toLowerCase(), a.tamano ? TAMANO[a.tamano].toLowerCase() : null, textoEdad(a.edadAproxMeses).toLowerCase()].filter(Boolean).join(" · ")}
                    <span className="nota"> · {f.proponente ? "enviada" : "ficha del municipio"} el {fechaCorta(f.creadaEn)} ({haceDias(f.creadaEn)})</span>
                  </p>
                  {f.caracter && <p className={propios.texto}>{f.caracter}</p>}
                  <details className={estilos.masDetalles}>
                    <summary>Más detalles</summary>
                    <dl className={estilos.datos}>
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
                            {f.proponente.nombre}
                            {f.relacion ? ` · ${RELACION_ANIMAL[f.relacion].toLowerCase()}` : ""}
                          </dd>
                          <dt>Contacto</dt>
                          <dd>{[f.proponente.telefono, f.proponente.correo].filter(Boolean).join(" · ") || "[sin contacto]"}</dd>
                          <dt>Autorización</dt>
                          <dd><ConIcono si={f.autorizaPublicar} texto={f.autorizaPublicar ? "Declaró que puede darlo en adopción" : "Sin declaración"} /></dd>
                        </>
                      )}
                      {f.codigo && (
                        <>
                          <dt>Código</dt>
                          <dd>{f.codigo}</dd>
                        </>
                      )}
                    </dl>
                  </details>
                  <div className={propios.acciones}>
                    <BotonAccion
                      accion={aprobarPropuesta.bind(null, f.id)}
                      texto="Aprobar y publicar"
                      variante="primario"
                      confirmar={`La ficha de ${nombre} se publicará en el catálogo de adopción con sus fotos. ¿Revisaste que las fotos y los datos sean adecuados?`}
                      textoConfirmar="Sí, publicar"
                    />
                    <AccionConMotivo accion={pedirCorrecciones.bind(null, f.id)} texto="Pedir cambios" pregunta="¿Qué debe corregir quien la propuso?" textoConfirmar="Pedir cambios" />
                    <AccionConMotivo accion={rechazarPropuesta.bind(null, f.id)} texto="No publicar" pregunta="¿Por qué no se publicará?" textoConfirmar="No publicar" />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
