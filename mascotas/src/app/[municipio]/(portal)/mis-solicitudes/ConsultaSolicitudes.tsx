"use client";
// Mis solicitudes: se entra con el correo y un código de un solo uso que te
// enviamos cada vez. No hay contraseña ni número que recordar. La sesión dura
// unas horas en este navegador (cookie del servidor) y «Salir» la cierra.
import { useEffect, useState, useTransition } from "react";
import { Boton } from "@/componentes/Boton";
import { EtiquetaEstado } from "@/componentes/EtiquetaEstado";
import { CampoTexto } from "@/componentes/formulario/Campos";
import { Icono } from "@/componentes/Icono";
import { conversacionesComoDueno, type ConversacionVista } from "@/servidor/portal/conversaciones";
import { entrarConCodigoAcceso, misSolicitudes, pedirCodigoAcceso, salirDeMisSolicitudes, type AvisoPersona, type ResultadoConsulta, type Tramite } from "@/servidor/portal/acciones";
import formulario from "@/componentes/formulario/formulario.module.css";
import { GestionAviso } from "./GestionAviso";
import { GestionComunitario } from "./GestionComunitario";
import { GestionCupo } from "./GestionCupo";
import { GestionInvitacion } from "./GestionInvitacion";
import { useActualizar } from "@/componentes/portal/useActualizar";
import { Conversaciones, esperaRespuesta } from "./Conversaciones";
import { GestionPropuesta } from "./GestionPropuesta";
import estilos from "./mis-solicitudes.module.css";

export function ConsultaSolicitudes() {
  const [correo, setCorreo] = useState("");
  const [codigoCorreo, setCodigoCorreo] = useState("");
  // En modo de prueba (sin envío de correos configurado) el código se muestra en pantalla.
  const [enviado, setEnviado] = useState<{ mensaje: string; codigoPrueba?: string } | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [tramites, setTramites] = useState<Tramite[] | null>(null);
  const [avisos, setAvisos] = useState<AvisoPersona[]>([]);
  const [conversaciones, setConversaciones] = useState<ConversacionVista[]>([]);
  // Al abrir la página se revisa si ya hay una sesión: mientras tanto, un bloque de espera.
  const [revisando, setRevisando] = useState(true);
  const [consultando, iniciar] = useTransition();
  const [aviso, setAviso] = useState<string | null>(null);

  function mostrar(r: ResultadoConsulta) {
    if (r.ok) {
      setTramites(r.tramites);
      setAvisos(r.avisos);
      // Las conversaciones se leen aparte, con la misma sesión.
      conversacionesComoDueno().then(setConversaciones);
    } else {
      setTramites(null);
      setErrores(r.errores ?? {});
      setMensaje(r.mensaje ?? null);
    }
  }

  useEffect(() => {
    misSolicitudes()
      .then((r) => {
        if (r.ok) mostrar(r);
      })
      .finally(() => setRevisando(false));
  }, []);

  // Tras una acción (confirmar, cancelar, responder), se vuelve a consultar para ver su estado nuevo.
  function alTerminar(texto: string) {
    setAviso(texto);
    iniciar(async () => {
      const r = await misSolicitudes();
      if (r.ok) mostrar(r);
      else if ("sinSesion" in r) setTramites(null);
    });
  }

  // Mensajes nuevos sin recargar: se vuelven a leer las conversaciones cada 10 segundos.
  useActualizar(() => conversacionesComoDueno().then(setConversaciones), 10_000, Boolean(tramites));

  function pedirCodigo(e: React.FormEvent) {
    e.preventDefault();
    setErrores({});
    setMensaje(null);
    if (!correo.trim()) return setErrores({ correo: "Escribe tu correo." });
    iniciar(async () => {
      const r = await pedirCodigoAcceso({ correo });
      if (r.ok) setEnviado({ mensaje: r.mensaje, codigoPrueba: r.codigoPrueba });
      else {
        setErrores(r.errores ?? {});
        setMensaje(r.mensaje);
      }
    });
  }

  function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErrores({});
    setMensaje(null);
    if (!/^\d{6}$/.test(codigoCorreo)) return setErrores({ codigoCorreo: "Escribe los 6 dígitos del código." });
    iniciar(async () => mostrar(await entrarConCodigoAcceso({ correo, codigo: codigoCorreo })));
  }

  function salir() {
    iniciar(async () => {
      await salirDeMisSolicitudes();
      setTramites(null);
      setAvisos([]);
      setAviso(null);
      setEnviado(null);
      setCodigoCorreo("");
    });
  }

  if (revisando) return <div className={estilos.esqueleto} aria-label="Cargando" />;

  return (
    <div className={estilos.contenedor}>
      {!tramites && (
        <form className={formulario.formulario} onSubmit={enviado ? entrar : pedirCodigo} noValidate aria-label="Entrar con un código enviado a mi correo">
          {!enviado ? (
            <CampoTexto
              id="correo"
              etiqueta="Tu correo"
              valor={correo}
              alCambiar={setCorreo}
              error={errores.correo}
              ayuda="El que dejaste en tus trámites. Te enviaremos un código para entrar; no necesitas contraseña."
              tipo="email"
              autoComplete="email"
              inputMode="email"
              maxLength={120}
            />
          ) : (
            <>
              <p role="status">{enviado.mensaje}</p>
              {enviado.codigoPrueba && (
                <p className={formulario.nota}>
                  <Icono nombre="info" tamano={20} />
                  <span>
                    Código de prueba: <b className="dato">{enviado.codigoPrueba}</b>
                  </span>
                </p>
              )}
              <CampoTexto id="codigoCorreo" etiqueta="Código de 6 dígitos" valor={codigoCorreo} alCambiar={(x) => setCodigoCorreo(x.replace(/\D/g, "").slice(0, 6))} error={errores.codigoCorreo} inputMode="numeric" autoComplete="one-time-code" maxLength={6} />
            </>
          )}
          {mensaje && (
            <p className={formulario.mensaje} role="alert">
              <Icono nombre="alerta" tamano={20} />
              {mensaje}
            </p>
          )}
          <div className={formulario.navegacion}>
            {enviado && (
              <Boton variante="secundario" onClick={() => setEnviado(null)} disabled={consultando}>
                Pedir otro código
              </Boton>
            )}
            <Boton type="submit" disabled={consultando}>
              {consultando ? "Un momento…" : enviado ? "Entrar" : "Enviarme un código"}
            </Boton>
          </div>
        </form>
      )}

      {tramites && (
        <section aria-labelledby="mis-tramites" className={estilos.lista} aria-live="polite">
          <div className={formulario.navegacion}>
            <Boton variante="secundario" onClick={salir} disabled={consultando}>
              Salir
            </Boton>
          </div>
          {aviso && (
            <p className={estilos.confirmacion} role="status">
              <Icono nombre="check" tamano={20} />
              {aviso}
            </p>
          )}
          {conversaciones.some(esperaRespuesta) && (
            <p className={estilos.mensajeNuevo} role="status">
              <Icono nombre="mensaje" tamano={20} />
              {conversaciones.filter(esperaRespuesta).length === 1 ? "Tienes un mensaje nuevo esperando tu respuesta." : `Tienes ${conversaciones.filter(esperaRespuesta).length} mensajes nuevos esperando tu respuesta.`}
            </p>
          )}
          {tramites.some((t) => t.invitacion?.responder) && (
            <p className={estilos.invitacion} role="status">
              <Icono nombre="calendario" tamano={20} />
              Tienes una invitación prioritaria a un operativo por responder.
            </p>
          )}
          {conversaciones.length > 0 && <Conversaciones conversaciones={conversaciones} alTerminar={alTerminar} />}
          {tramites.length === 0 ? (
            <p>No encontramos trámites con este correo. Si hiciste uno con otro correo, sal y entra con ese.</p>
          ) : (
            <h2 id="mis-tramites">{tramites.length === 1 ? "Tu trámite" : `Tus ${tramites.length} trámites`}</h2>
          )}
          <ul>
            {tramites.map((t, i) => (
              <li key={t.codigo ?? i} className={estilos.tramite}>
                <div className={estilos.encabezado}>
                  <span className={estilos.tipo}>{t.tipo}</span>
                  <EtiquetaEstado estado={t.estado} />
                </div>
                <p className={estilos.detalle}>{t.detalle}</p>
                {t.nota && <p>{t.nota}</p>}
                {t.invitacion?.responder && t.codigo && <GestionInvitacion codigo={t.codigo} alTerminar={alTerminar} />}
                {t.comunitario && t.codigo && <GestionComunitario codigo={t.codigo} perro={t.comunitario} alTerminar={alTerminar} />}
                {t.cupo && t.codigo && <GestionCupo codigo={t.codigo} enEspera={t.cupo.enEspera} alTerminar={alTerminar} />}
                {t.aviso && t.codigo && <GestionAviso codigo={t.codigo} tipo={t.aviso.tipo} coincidencias={t.aviso.coincidencias} alTerminar={alTerminar} />}
                {t.propuesta && t.codigo && (t.propuesta.corregir || t.propuesta.cerrar || t.propuesta.postulaciones > 0) && (
                  <GestionPropuesta codigo={t.codigo} corregir={t.propuesta.corregir} cerrar={t.propuesta.cerrar} postulaciones={t.propuesta.postulaciones} alTerminar={alTerminar} />
                )}
                <p className="nota">Ingresado el {t.fecha}</p>
              </li>
            ))}
          </ul>
          {avisos.length > 0 && (
            <section aria-labelledby="avisos-persona" className={estilos.avisos}>
              <h2 id="avisos-persona">Avisos para ti</h2>
              <p className="nota">Lo que te hemos enviado por correo.</p>
              <ul>
                {avisos.map((a, j) => (
                  <li key={j}>
                    <b>{a.asunto}</b> · {a.fecha}
                    <p>{a.contenido}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </section>
      )}
    </div>
  );
}
