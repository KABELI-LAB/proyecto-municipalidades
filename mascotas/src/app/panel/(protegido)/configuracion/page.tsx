import type { Metadata } from "next";
import { Icono } from "@/componentes/Icono";
import { EstadoInstagram } from "@/componentes/panel/EstadoInstagram";
import { Interruptor } from "@/componentes/panel/Interruptor";
import { requerir } from "@/servidor/auth";
import { guardarDemoInstagram, guardarPublicacionAutomatica } from "@/servidor/panel/acciones-redes";
import { configuracionInstagram, pendientesInstagram } from "@/servidor/panel/configuracion";
import estilos from "@/estilos/paginas.module.css";
import propios from "./configuracion.module.css";

export const metadata: Metadata = { title: "Configuración · Panel municipal" };

// Responde: ¿lo que aprobamos sale solo en Instagram? Un interruptor y, si
// está apagado o algo falló, lo que falta publicar, con su botón.
export default async function Configuracion() {
  await requerir("configurarRedes");
  const { automatica, incluirDemo, integracion } = await configuracionInstagram();
  const pendientes = await pendientesInstagram(incluirDemo);

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <h1>Configuración</h1>
        <p>Cómo se difunde en Instagram lo que publica la Municipalidad.</p>
      </div>

      <section className={propios.tarjeta} aria-labelledby="instagram">
        <div className={propios.titulo}>
          <h2 id="instagram">Instagram</h2>
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

        <Interruptor
          id="publicar-auto"
          etiqueta="Publicar automáticamente"
          descripcion="Al aprobar un aviso o una adopción, o al publicar un operativo, también sale en Instagram. Apagado: sale solo en el portal y lo publicas tú desde esta página."
          inicial={automatica}
          guardar={guardarPublicacionAutomatica}
        />
        <Interruptor
          id="incluir-demo"
          etiqueta="Incluir datos de demostración"
          descripcion="Solo para pruebas: el contenido de demostración también se publica, con su marca."
          inicial={incluirDemo}
          guardar={guardarDemoInstagram}
        />
      </section>

      {integracion.configurada && (
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
    </div>
  );
}
