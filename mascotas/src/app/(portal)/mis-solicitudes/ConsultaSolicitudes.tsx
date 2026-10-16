"use client";
// El RUT viaja en el cuerpo de la acción de servidor, nunca en la URL.
import { useState, useTransition } from "react";
import { Boton } from "@/componentes/Boton";
import { EtiquetaEstado } from "@/componentes/EtiquetaEstado";
import { CampoTexto } from "@/componentes/formulario/Campos";
import { Icono } from "@/componentes/Icono";
import { esquemaConsulta, validarCampos, type Errores } from "@/lib/esquemas";
import { consultarSolicitudes, entrarConCodigoAcceso, pedirCodigoAcceso, type AvisoPersona, type ResultadoConsulta, type Tramite } from "@/servidor/portal/acciones";
import formulario from "@/componentes/formulario/formulario.module.css";
import { GestionAviso } from "./GestionAviso";
import { GestionComunitario } from "./GestionComunitario";
import { GestionCupo } from "./GestionCupo";
import { GestionInvitacion } from "./GestionInvitacion";
import { GestionPropuesta } from "./GestionPropuesta";
import estilos from "./mis-solicitudes.module.css";

type Modo = "correo" | "codigo";

export function ConsultaSolicitudes() {
  const [modo, setModo] = useState<Modo>("correo");
  const [v, setV] = useState({ rut: "", codigo: "" });
  // Entrada con correo: código de 6 dígitos, pista del correo y, en modo de prueba, el código en pantalla.
  const [codigoCorreo, setCodigoCorreo] = useState("");
  const [enviado, setEnviado] = useState<{ mensaje: string; pista?: string; codigoPrueba?: string } | null>(null);
  const [errores, setErrores] = useState<Errores>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [tramites, setTramites] = useState<Tramite[] | null>(null);
  const [avisos, setAvisos] = useState<AvisoPersona[]>([]);
  const [consultando, iniciar] = useTransition();
  const [aviso, setAviso] = useState<string | null>(null);

  // Tras confirmar o cerrar un aviso, se vuelve a consultar para ver su estado nuevo.
  function alTerminar(texto: string) {
    setAviso(texto);
    iniciar(async () => {
      const r = await consultarSolicitudes(v);
      if (r.ok) {
        setTramites(r.tramites);
        setAvisos(r.avisos);
      }
    });
  }

  function mostrar(r: ResultadoConsulta, rut: string) {
    if (r.ok) {
      setTramites(r.tramites);
      setAvisos(r.avisos);
      // Para volver a consultar tras una acción, basta cualquiera de sus códigos.
      const propio = r.tramites.find((t) => t.codigo)?.codigo;
      if (propio) setV({ rut, codigo: propio });
    } else {
      setTramites(null);
      setErrores(r.errores ?? {});
      setMensaje(r.mensaje ?? null);
    }
  }

  function consultar(e: React.FormEvent) {
    e.preventDefault();
    const err = validarCampos(esquemaConsulta, v);
    setErrores(err);
    setMensaje(null);
    if (Object.keys(err).length > 0) return;
    iniciar(async () => mostrar(await consultarSolicitudes(v), v.rut));
  }

  function pedirCodigo(e: React.FormEvent) {
    e.preventDefault();
    setErrores({});
    setMensaje(null);
    if (!v.rut.trim()) return setErrores({ rut: "Escribe tu RUT." });
    iniciar(async () => {
      const r = await pedirCodigoAcceso({ rut: v.rut });
      if (r.ok) setEnviado({ mensaje: r.mensaje, pista: r.pista, codigoPrueba: r.codigoPrueba });
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
    iniciar(async () => mostrar(await entrarConCodigoAcceso({ rut: v.rut, codigo: codigoCorreo }), v.rut));
  }

  const cambiarModo = (m: Modo) => {
    setModo(m);
    setErrores({});
    setMensaje(null);
    setEnviado(null);
  };

  return (
    <div className={estilos.contenedor}>
      {!tramites && (
        <div className={estilos.modos} role="tablist" aria-label="Cómo quieres entrar">
          <button type="button" role="tab" aria-selected={modo === "correo"} className={estilos.modo} onClick={() => cambiarModo("correo")}>
            <Icono nombre="mensaje" tamano={20} />
            Recibir un código en mi correo
          </button>
          <button type="button" role="tab" aria-selected={modo === "codigo"} className={estilos.modo} onClick={() => cambiarModo("codigo")}>
            <Icono nombre="documento" tamano={20} />
            Tengo un código de trámite
          </button>
        </div>
      )}

      {!tramites && modo === "correo" && (
        <form className={formulario.formulario} onSubmit={enviado ? entrar : pedirCodigo} noValidate aria-label="Entrar con un código enviado a mi correo">
          {!enviado ? (
            <>
              <CampoTexto id="rut" etiqueta="RUT" valor={v.rut} alCambiar={(x) => setV((s) => ({ ...s, rut: x }))} error={errores.rut} ayuda="Te enviaremos un código al correo que dejaste en tus trámites. No necesitas registrarte." maxLength={12} />
            </>
          ) : (
            <>
              <p role="status">
                {enviado.mensaje}
                {enviado.pista && ` Correo: ${enviado.pista}.`}
              </p>
              {enviado.codigoPrueba && (
                <p className={formulario.nota}>
                  <Icono nombre="info" tamano={20} />
                  <span>
                    Código de prueba: <b>{enviado.codigoPrueba}</b>
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

      {!tramites && modo === "codigo" && (
      <form className={formulario.formulario} onSubmit={consultar} noValidate aria-label="Consultar mis solicitudes">
          <div className={formulario.fila}>
            <CampoTexto id="rut" etiqueta="RUT" valor={v.rut} alCambiar={(x) => setV((s) => ({ ...s, rut: x }))} error={errores.rut} ayuda="Por ejemplo, 12.345.678-5." maxLength={12} />
            <CampoTexto id="codigo" etiqueta="Código de seguimiento" valor={v.codigo} alCambiar={(x) => setV((s) => ({ ...s, codigo: x.toUpperCase() }))} error={errores.codigo} ayuda="Por ejemplo, TR-4043." maxLength={7} />
          </div>
          {mensaje && (
            <p className={formulario.mensaje} role="alert">
              <Icono nombre="alerta" tamano={20} />
              {mensaje}
            </p>
          )}
          <div className={formulario.navegacion}>
            <Boton type="submit" disabled={consultando}>
              {consultando ? "Consultando…" : "Ver mis solicitudes"}
            </Boton>
          </div>
        </form>
      )}

      {tramites && (
        <section aria-labelledby="mis-tramites" className={estilos.lista} aria-live="polite">
          <div className={formulario.navegacion}>
            <Boton
              variante="secundario"
              onClick={() => {
                setTramites(null);
                setAvisos([]);
                setAviso(null);
                setEnviado(null);
                setCodigoCorreo("");
                setV({ rut: "", codigo: "" });
              }}
            >
              Salir
            </Boton>
          </div>
          {aviso && (
            <p className={estilos.confirmacion} role="status">
              <Icono nombre="check" tamano={20} />
              {aviso}
            </p>
          )}
          {tramites.some((t) => t.invitacion?.responder) && (
            <p className={estilos.invitacion} role="status">
              <Icono nombre="calendario" tamano={20} />
              Tienes una invitación prioritaria a un operativo por responder.
            </p>
          )}
          <h2 id="mis-tramites">{tramites.length === 1 ? "Tu trámite" : `Tus ${tramites.length} trámites`}</h2>
          <ul>
            {tramites.map((t, i) => (
              <li key={t.codigo ?? i} className={estilos.tramite}>
                <div className={estilos.encabezado}>
                  <span className={estilos.tipo}>{t.tipo}</span>
                  <EtiquetaEstado estado={t.estado} />
                </div>
                <p className={estilos.detalle}>{t.detalle}</p>
                {t.nota && <p>{t.nota}</p>}
                {t.invitacion?.responder && t.codigo && <GestionInvitacion rut={v.rut} codigo={t.codigo} alTerminar={alTerminar} />}
                {t.comunitario && t.codigo && <GestionComunitario rut={v.rut} codigo={t.codigo} perro={t.comunitario} alTerminar={alTerminar} />}
                {t.cupo && t.codigo && <GestionCupo rut={v.rut} codigo={t.codigo} enEspera={t.cupo.enEspera} alTerminar={alTerminar} />}
                {t.aviso && t.codigo && <GestionAviso rut={v.rut} codigo={t.codigo} tipo={t.aviso.tipo} coincidencias={t.aviso.coincidencias} alTerminar={alTerminar} />}
                {t.propuesta && t.codigo && (t.propuesta.corregir || t.propuesta.cerrar || t.propuesta.postulaciones > 0) && (
                  <GestionPropuesta rut={v.rut} codigo={t.codigo} corregir={t.propuesta.corregir} cerrar={t.propuesta.cerrar} postulaciones={t.propuesta.postulaciones} alTerminar={alTerminar} />
                )}
                <p className="nota">
                  {t.codigo ? `Código ${t.codigo} · ` : ""}ingresado el {t.fecha}
                </p>
              </li>
            ))}
          </ul>
          {avisos.length > 0 && (
            <section aria-labelledby="avisos-persona" className={estilos.avisos}>
              <h2 id="avisos-persona">Avisos para ti</h2>
              <p className="nota">Lo que te hemos enviado. Si el envío de correos no está configurado, los avisos se ven solo aquí.</p>
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
