import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Icono } from "@/componentes/Icono";
import { EstadoInstagram } from "@/componentes/panel/EstadoInstagram";
import { Interruptor } from "@/componentes/panel/Interruptor";
import { inicioDe, puede } from "@/dominio/permisos";
import { PERMISO_RED, type TipoRed } from "@/dominio/redes";
import { requerir } from "@/servidor/auth";
import { INTENCION, type Intencion } from "@/dominio/respuestas";
import { fechaCorta } from "@/servidor/formato";
import { guardarDemoInstagram, guardarPublicacionAutomatica, guardarRespuestasAutomaticas } from "@/servidor/panel/acciones-redes";
import { ultimasInteracciones } from "@/servidor/redes/respuestas";
import { configuracionInstagram, pendientesInstagram } from "@/servidor/panel/instagram";
import estilos from "@/estilos/paginas.module.css";
import propios from "./instagram.module.css";

export const metadata: Metadata = { title: "Instagram · Panel municipal" };

// Responde: ¿qué falta publicar en Instagram? Quien aprueba o publica ve lo
// suyo, con su botón; administración además enciende o apaga la publicación
// automática.
export default async function Instagram() {
  const usuario = await requerir();
  const administra = puede(usuario.rol, "configurarRedes");
  const tipos = (Object.keys(PERMISO_RED) as TipoRed[]).filter((t) => puede(usuario.rol, PERMISO_RED[t]));
  if (!administra && !tipos.length) redirect(inicioDe(usuario.rol));
  const { automatica, incluirDemo, responder, integracion, faltanParaResponder } = await configuracionInstagram();
  const [pendientes, conversaciones] = await Promise.all([pendientesInstagram(incluirDemo, tipos), ultimasInteracciones(15)]);

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <h1>Instagram</h1>
        <p>Lo que se publica en el portal y su difusión en Instagram.</p>
      </div>

      <section className={propios.tarjeta} aria-labelledby="publicacion">
        <div className={propios.titulo}>
          <h2 id="publicacion">Publicación</h2>
          {integracion.configurada ? (
            <span className={`${propios.insignia} ${propios.ok}`}>
              <Icono nombre="check" tamano={14} />
              Credenciales cargadas
            </span>
          ) : (
            <span className={`${propios.insignia} ${propios.falta}`}>
              <Icono nombre="alerta" tamano={14} />
              Falta configurar
            </span>
          )}
        </div>
        {!integracion.configurada && (
          <p className={propios.nota}>Mientras falten las credenciales, todo se publica solo en el portal. Pídelas a quien administra la plataforma.</p>
        )}

        {administra ? (
          <>
            <Interruptor
              id="publicar-auto"
              etiqueta="Publicar automáticamente"
              descripcion="Al aprobar un aviso o una adopción, o al publicar un operativo, también sale en Instagram. Apagado: sale solo en el portal y se publica desde esta página."
              inicial={automatica}
              guardar={guardarPublicacionAutomatica}
            />
            <Interruptor
              id="responder-auto"
              etiqueta="Responder comentarios y mensajes"
              descripcion="Responde con el enlace del portal que corresponde: el operativo, el aviso o la adopción comentada. En los comentarios, el detalle va por mensaje privado."
              inicial={responder}
              guardar={guardarRespuestasAutomaticas}
            />
            {faltanParaResponder.length > 0 && (
              <p className={propios.nota}>Para que Instagram nos avise de comentarios y mensajes falta configurar: {faltanParaResponder.join(", ")}.</p>
            )}
            <Interruptor
              id="incluir-demo"
              etiqueta="Incluir datos de demostración"
              descripcion="Solo para pruebas: el contenido de demostración también se publica, con su marca."
              inicial={incluirDemo}
              guardar={guardarDemoInstagram}
            />
          </>
        ) : (
          <p>
            <b>
              Publicación automática: {automatica ? "encendida" : "apagada"}. Respuestas automáticas: {responder ? "encendidas" : "apagadas"}.
            </b>{" "}
            <span className={propios.nota}>
              {automatica ? "Lo que apruebas o publicas también sale en Instagram." : "Lo que apruebas o publicas sale solo en el portal; publícalo en Instagram desde la lista de abajo."} La
              cambia administración.
            </span>
          </p>
        )}
      </section>

      {integracion.configurada && tipos.length > 0 && (
        <section className={propios.tarjeta} aria-labelledby="pendientes">
          <div className={propios.titulo}>
            <h2 id="pendientes">Sin publicar en Instagram</h2>
          </div>
          <p className={propios.nota}>Contenido publicado en el portal que todavía no sale en Instagram, o cuyo intento falló.</p>
          {pendientes.length === 0 ? (
            <p>Todo lo publicado en el portal ya está en Instagram.</p>
          ) : (
            <ul className={propios.lista}>
              {pendientes.map((p) => (
                <li key={`${p.tipo}-${p.id}`}>
                  <span>
                    <b>{p.titulo}</b>
                    <span className={propios.nota}>{p.detalle}</span>
                  </span>
                  <EstadoInstagram tipo={p.tipo} id={p.id} estado={p.estado} configurada />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {conversaciones.length > 0 && (
        <section className={propios.tarjeta} aria-labelledby="conversaciones">
          <div className={propios.titulo}>
            <h2 id="conversaciones">Comentarios y mensajes</h2>
          </div>
          <p className={propios.nota}>Lo último que escribieron en Instagram y qué respondimos. Lo que no tuvo respuesta conviene revisarlo en la app de Instagram.</p>
          <ul className={propios.lista}>
            {conversaciones.map((c) => (
              <li key={c.id}>
                <span>
                  <b>«{c.texto.length > 140 ? `${c.texto.slice(0, 137)}…` : c.texto}»</b>
                  <span className={propios.nota}>
                    {c.canal === "COMENTARIO" ? "Comentario" : "Mensaje"} · {INTENCION[c.intencion as Intencion] ?? c.intencion} · {fechaCorta(c.creadaEn)}
                  </span>
                  {c.error && <span className={propios.nota}>No se pudo responder: {c.error}</span>}
                </span>
                <span className={`${propios.insignia} ${c.estado === "RESPONDIDA" ? propios.ok : propios.falta}`}>
                  <Icono nombre={c.estado === "RESPONDIDA" ? "check" : "alerta"} tamano={14} />
                  {c.estado === "RESPONDIDA" ? "Respondido" : c.estado === "ERROR" ? "Con error" : "Sin respuesta"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
