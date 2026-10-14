import type { Metadata } from "next";
import { GaleriaOperativo } from "@/componentes/GaleriaOperativo";
import { notFound } from "next/navigation";
import { EnlaceBoton } from "@/componentes/Boton";
import { EtiquetaEstado } from "@/componentes/EtiquetaEstado";
import { BotonAccion } from "@/componentes/panel/BotonAccion";
import { BarrasOcupacion } from "@/componentes/panel/Piezas";
import { ESPECIE, ESTADO_CUPO, ESTADO_OPERATIVO, ORIGEN_OPERATIVO } from "@/dominio/etiquetas";
import { ESTADO_INVITACION } from "@/dominio/invitaciones";
import { numero, porcentaje } from "@/dominio/formato";
import { puede } from "@/dominio/permisos";
import { EstadoInstagram } from "@/componentes/panel/EstadoInstagram";
import { requerir } from "@/servidor/auth";
import { estadoIntegracion } from "@/servidor/redes/instagram";
import { estadosInstagram } from "@/servidor/redes/servicio";
import { fechaCorta, fechaLarga, hora } from "@/servidor/formato";
import {
  cancelar,
  cancelarCupo,
  cerrar,
  cerrarInscripciones,
  confirmarCupo,
  enviarRecordatorios,
  iniciar,
  invitarNuevamente,
  liberarNoConfirmados,
  publicar,
  reabrirInscripciones,
} from "@/servidor/panel/acciones-operativos";
import { invitacionesActivas } from "@/servidor/invitaciones";
import { detalleOperativo } from "@/servidor/panel/operativos";
import estilos from "@/estilos/paginas.module.css";
import piezas from "@/componentes/panel/piezas.module.css";

export const metadata: Metadata = { title: "Operativo · Panel municipal" };

// Qué conviene hacer en cada estado.
const SIGUIENTE_CON_INVITACIONES: Record<string, string> = {
  BORRADOR: "Revise los datos y publique. Al publicar invitamos primero a las solicitudes pendientes compatibles (mismo servicio, del sector o cercanas).",
  PUBLICADO: "Inscripciones abiertas. Las personas invitadas responden en el portal; el sistema asigna cupos y vence las invitaciones sin respuesta. Envíe recordatorios 48 horas antes y asigne al equipo de terreno.",
  INSCRIPCIONES_CERRADAS: "Las invitaciones aún abiertas pueden responderse hasta su plazo. Inicie el operativo el día de la atención.",
  EN_CURSO: "Registre la asistencia y las atenciones. Al terminar, cierre el operativo para calcular resultados.",
  CERRADO: "Los resultados ya actualizan la ficha y la prioridad del sector.",
  CANCELADO: "Las personas inscritas fueron avisadas y sus solicitudes siguen como demanda pendiente.",
};
/** Sin invitaciones prioritarias (apagadas en la configuración del municipio). */
const SIGUIENTE_SIN_INVITACIONES: Record<string, string> = {
  BORRADOR: "Revise los datos y publique. Al publicar, las inscripciones quedan abiertas en el portal.",
  PUBLICADO: "Inscripciones abiertas en el portal. Si se libera un cupo, pasa al primero de la lista de espera. Envíe recordatorios antes del día.",
  INSCRIPCIONES_CERRADAS: "Inscripciones cerradas. Inicie el operativo el día de la atención.",
  EN_CURSO: "Registre la asistencia y las atenciones. Al terminar, cierre el operativo para calcular resultados.",
  CERRADO: "Los resultados ya actualizan la ficha y la prioridad del sector.",
  CANCELADO: "Las personas inscritas fueron avisadas y sus solicitudes siguen como demanda pendiente.",
};

export default async function DetalleOperativo({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await requerir("verOperativos");
  const { id } = await params;
  const verInscritos = puede(usuario.rol, "verInscritos");
  const o = await detalleOperativo(id, verInscritos);
  if (!o) notFound();
  const gestiona = puede(usuario.rol, "gestionarOperativos");
  const antesDeIniciar = o.estado === "PUBLICADO" || o.estado === "INSCRIPCIONES_CERRADAS";
  const instagram = gestiona && o.estado === "PUBLICADO" ? (await estadosInstagram("OPERATIVO", [o.id]))[o.id] : undefined;
  const porServicio = o.resultado ? (JSON.parse(o.resultado.atencionesPorServicio) as Record<string, number>) : {};

  return (
    <div className={`contenedor ${estilos.pagina}`}>

      <div className={estilos.cabecera}>
        <EtiquetaEstado estado={ESTADO_OPERATIVO[o.estado]} />
        <h1>Operativo en {o.sector.nombre}</h1>
        <p>
          {fechaLarga(o.fecha)}, de {o.horaInicio} a {o.horaFin} horas, en {o.lugar.nombre}.
        </p>
      </div>

      {gestiona && (
        <section className={estilos.panel} aria-labelledby="acciones">
          <h2 id="acciones">Siguiente paso</h2>
          <p>{(invitacionesActivas() ? SIGUIENTE_CON_INVITACIONES : SIGUIENTE_SIN_INVITACIONES)[o.estado]}</p>
          <div className={piezas.acciones}>
            {o.estado === "BORRADOR" && (
              <>
                <EnlaceBoton href={`/panel/operativos/${o.id}/editar`} variante="secundario">
                  Editar borrador
                </EnlaceBoton>
                <BotonAccion
                  accion={publicar.bind(null, o.id)}
                  texto="Publicar operativo"
                  variante="primario"
                  confirmar={
                    invitacionesActivas()
                      ? "Al publicar, invitaremos a las solicitudes pendientes del sector hasta completar los cupos, abriremos las inscripciones en el portal y dejaremos un aviso en borrador para comunicaciones."
                      : "Al publicar, abriremos las inscripciones en el portal y dejaremos un aviso en borrador para comunicaciones."
                  }
                  textoConfirmar="Sí, publicar"
                />
              </>
            )}
            {antesDeIniciar && invitacionesActivas() && <BotonAccion accion={invitarNuevamente.bind(null, o.id)} texto="Actualizar invitaciones" />}
            {antesDeIniciar && (
              <>
                <BotonAccion accion={enviarRecordatorios.bind(null, o.id)} texto="Enviar recordatorios" confirmar="Enviaremos un recordatorio a todas las personas con cupo (envío simulado en el prototipo)." />
                {o.ocupacion.some((s) => s.invitados > 0) && (
                  <BotonAccion accion={liberarNoConfirmados.bind(null, o.id)} texto="Liberar cupos invitados sin confirmar" confirmar="Los cupos en estado Invitado (anteriores a las invitaciones prioritarias) se liberan. Esas solicitudes siguen como demanda pendiente." />
                )}
              </>
            )}
            {o.estado === "PUBLICADO" && <BotonAccion accion={cerrarInscripciones.bind(null, o.id)} texto="Cerrar inscripciones" />}
            {o.estado === "INSCRIPCIONES_CERRADAS" && <BotonAccion accion={reabrirInscripciones.bind(null, o.id)} texto="Reabrir inscripciones" />}
            {antesDeIniciar && <BotonAccion accion={iniciar.bind(null, o.id)} texto="Iniciar operativo" variante="primario" confirmar="Al iniciar se cierran las inscripciones y se puede registrar asistencia y atenciones." textoConfirmar="Sí, iniciar" />}
            {o.estado === "EN_CURSO" && (
              <>
                <EnlaceBoton href={`/panel/operativos/${o.id}/asistencia`} variante="secundario">
                  Registrar asistencia
                </EnlaceBoton>
                <BotonAccion
                  accion={cerrar.bind(null, o.id)}
                  texto="Cerrar operativo"
                  variante="primario"
                  confirmar="Al cerrar, los cupos confirmados sin asistencia registrada cuentan como inasistencia; las invitaciones sin confirmar y la lista de espera vuelven a la demanda pendiente. No se puede deshacer."
                  textoConfirmar="Sí, cerrar"
                />
              </>
            )}
            {(o.estado === "BORRADOR" || antesDeIniciar) && (
              <BotonAccion
                accion={cancelar.bind(null, o.id)}
                texto="Cancelar operativo"
                confirmar="Avisaremos a todas las personas inscritas y sus solicitudes volverán a la demanda pendiente. Quedará un aviso de cancelación en borrador para comunicaciones. No se puede deshacer."
                textoConfirmar="Sí, cancelar operativo"
              />
            )}
          </div>
          {o.estado === "PUBLICADO" && <EstadoInstagram tipo="OPERATIVO" id={o.id} estado={instagram} configurada={estadoIntegracion().configurada} />}
        </section>
      )}

      <div className={estilos.grillaDos}>
        <section className={`${estilos.panel} ${estilos.panelAncho}`} aria-labelledby="cupos">
          <h2 id="cupos">Cupos</h2>
          <BarrasOcupacion ocupacion={o.ocupacion} />
        </section>

        <section className={estilos.panel} aria-labelledby="datos">
          <h2 id="datos">Datos</h2>
          <dl className={estilos.datos}>
            <dt>Origen</dt>
            <dd>{ORIGEN_OPERATIVO[o.origen]}</dd>
            {o.creadoPor && (
              <>
                <dt>Creado por</dt>
                <dd>{o.creadoPor.nombre}</dd>
              </>
            )}
            {o.publicadoEn && (
              <>
                <dt>Publicado</dt>
                <dd>{fechaCorta(o.publicadoEn)}</dd>
              </>
            )}
            <dt>Requisitos</dt>
            <dd>{o.requisitos || "Sin requisitos indicados."}</dd>
          </dl>
        </section>

        <section className={estilos.panel} aria-labelledby="avisos">
          <h2 id="avisos">Avisos del operativo</h2>
          {o.avisos.length > 0 ? (
            <ul>
              {o.avisos.map((a) => (
                <li key={a.id}>
                  <b>{a.titulo}</b> · {a.estado === "BORRADOR" ? "en borrador, pendiente de revisión por comunicaciones" : "publicado"}
                </li>
              ))}
            </ul>
          ) : (
            <p>Al publicar se prepara un aviso automático.</p>
          )}
        </section>
      </div>

      {o.resultado && (
        <section className={estilos.seccion} aria-labelledby="resultado">
          <h2 id="resultado">Resultado</h2>
          <div className={estilos.panel}>
            <dl className={estilos.datos}>
              <dt>Asistencia</dt>
              <dd>
                {numero(o.resultado.asistentes)} de {numero(o.resultado.inscritos)} inscritos ({porcentaje(o.resultado.inscritos ? o.resultado.asistentes / o.resultado.inscritos : 0)})
              </dd>
              <dt>Atenciones realizadas</dt>
              <dd>
                {numero(o.resultado.atenciones)}
                {o.espontaneas > 0 ? `, de ellas ${numero(o.espontaneas)} sin inscripción previa` : ""}
              </dd>
              {o.ocupacion.map((s) => (
                <div key={s.servicioId} className={estilos.grupoDatos}>
                  <dt>{s.nombre}</dt>
                  <dd>{(porServicio[s.clave] ?? 0) === 1 ? "1 atención" : `${numero(porServicio[s.clave] ?? 0)} atenciones`}</dd>
                </div>
              ))}
              <dt>Demanda no cubierta</dt>
              <dd>{o.resultado.demandaNoCubierta === 1 ? "1 persona volvió" : `${numero(o.resultado.demandaNoCubierta)} personas volvieron`} a la demanda pendiente</dd>
            </dl>
          </div>
          <GaleriaOperativo fotos={o.fotos} sector={o.sector.nombre} />
        </section>
      )}

      {verInscritos && o.invitaciones.length > 0 && (
        <section className={estilos.seccion} aria-labelledby="invitaciones">
          <h2 id="invitaciones">Invitaciones prioritarias</h2>
          <p className="nota">
            Por prioridad: primero el mismo sector, luego localidades cercanas; dentro de cada grupo, la solicitud más antigua. Una invitación abierta retiene el
            cupo; confirmar interés no lo reserva: el sistema lo asigna si hay disponibilidad.
          </p>
          <div className={piezas.desplazable}>
            <table className={piezas.tabla}>
              <thead>
                <tr>
                  <th scope="col">Prioridad</th>
                  <th scope="col">Persona</th>
                  <th scope="col">Servicio</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Enviada · plazo</th>
                  <th scope="col">Respuesta · asignación</th>
                </tr>
              </thead>
              <tbody>
                {o.invitaciones.map((i) => (
                  <tr key={i.id}>
                    <td>{i.orden}</td>
                    <th scope="row">
                      {i.persona.nombre}
                      <br />
                      <span className="nota">{i.codigo}</span>
                    </th>
                    <td>{i.servicio.nombre}</td>
                    <td>
                      <EtiquetaEstado estado={ESTADO_INVITACION[i.estado]} />
                    </td>
                    <td>
                      {fechaCorta(i.creadaEn)} · vence {fechaCorta(i.venceEn)}, {hora(i.venceEn)}
                    </td>
                    <td>
                      {i.respondidaEn ? `Respondió ${fechaCorta(i.respondidaEn)}` : "—"}
                      {i.asignadaEn ? ` · cupo ${i.cupo?.codigo ?? ""} el ${fechaCorta(i.asignadaEn)}` : ""}
                      {i.cerradaEn && i.motivoCierre ? ` · ${i.motivoCierre}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {verInscritos && o.cupos.length > 0 && (
        <section className={estilos.seccion} aria-labelledby="inscritos">
          <h2 id="inscritos">Inscritos</h2>
          {o.ocupacion.map((s) => {
            const lista = o.cupos.filter((c) => c.servicioId === s.servicioId);
            if (lista.length === 0) return null;
            return (
              <div key={s.servicioId} className={estilos.seccion}>
                <h3>
                  {s.nombre} · {numero(lista.length)} {lista.length === 1 ? "registro" : "registros"}
                </h3>
                <div className={piezas.desplazable}>
                  <table className={piezas.tabla}>
                    <thead>
                      <tr>
                        <th scope="col">Persona</th>
                        <th scope="col">Contacto</th>
                        <th scope="col">Animal</th>
                        <th scope="col">Estado</th>
                        {gestiona && antesDeIniciar && <th scope="col">Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {lista.map((c) => (
                        <tr key={c.id}>
                          <th scope="row">
                            {c.persona.nombre}
                            <br />
                            <span className="nota">{c.codigo}</span>
                          </th>
                          <td>{[c.persona.telefono, c.persona.correo].filter(Boolean).join(" · ") || "—"}</td>
                          <td>
                            {c.animal.nombre ?? "Sin nombre"} ({ESPECIE[c.animal.especie].toLowerCase()})
                          </td>
                          <td>
                            <EtiquetaEstado estado={ESTADO_CUPO[c.estado]} />
                            {c.estado === "EN_LISTA_ESPERA" && c.posicionEspera && <span className="nota"> Lugar {c.posicionEspera}</span>}
                          </td>
                          {gestiona && antesDeIniciar && (
                            <td>
                              <div className={piezas.acciones}>
                                {c.estado === "INVITADO" && <BotonAccion accion={confirmarCupo.bind(null, c.id)} texto="Confirmó" />}
                                {["INVITADO", "CONFIRMADO", "EN_LISTA_ESPERA"].includes(c.estado) && (
                                  <BotonAccion
                                    accion={cancelarCupo.bind(null, c.id, "PERSONA")}
                                    texto="Canceló la persona"
                                    confirmar={`¿Registrar que ${c.persona.nombre} canceló? El cupo pasará al primero de la lista de espera.`}
                                    textoConfirmar="Sí, registrar"
                                  />
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
