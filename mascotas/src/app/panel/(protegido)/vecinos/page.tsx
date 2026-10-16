import type { Metadata } from "next";
import { Cifra } from "@/componentes/Cifra";
import { Icono } from "@/componentes/Icono";
import { BotonAccion } from "@/componentes/panel/BotonAccion";
import { numero } from "@/dominio/formato";
import { requerir } from "@/servidor/auth";
import { fechaCorta, hora } from "@/servidor/formato";
import { iaActiva } from "@/servidor/ia/openai";
import { generarResumen } from "@/servidor/panel/acciones-ia";
import { loQuePidenLosVecinos, ultimoResumen } from "@/servidor/panel/vecinos";
import estilos from "@/estilos/paginas.module.css";
import piezas from "@/componentes/panel/piezas.module.css";
import propios from "./vecinos.module.css";

export const metadata: Metadata = { title: "Lo que piden los vecinos · Panel municipal" };

const plural = (n: number, uno: string, varios: string) => `${numero(n)} ${n === 1 ? uno : varios}`;

// Responde: ¿qué están pidiendo y reportando los vecinos, y dónde?
export default async function LoQuePiden() {
  await requerir("verIndicadores");
  const [d, conIA, resumen] = await Promise.all([loQuePidenLosVecinos(), iaActiva(), ultimoResumen()]);
  const c = d.cifras;
  const maximo = Math.max(1, ...d.porServicio.map((s) => s.cantidad));

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <h1>Lo que piden los vecinos</h1>
        <p>Lo que hacen en el portal, hoy.</p>
      </div>

      <dl className={propios.cifras}>
        <div>
          <dt>Solicitudes de servicio</dt>
          <dd className={propios.cifra}>
            <Cifra valor={c.solicitudes} />
          </dd>
          <dd>esperando un operativo</dd>
        </div>
        <div>
          <dt>Mascotas perdidas</dt>
          <dd className={propios.cifra}>
            <Cifra valor={c.perdidas} />
          </dd>
          <dd>{plural(c.avistadas, "avistada", "avistadas")} en el portal</dd>
        </div>
        <div>
          <dt>Reportes SOS</dt>
          <dd className={propios.cifra}>
            <Cifra valor={c.reportes} />
          </dd>
          <dd>en los últimos 30 días</dd>
        </div>
        <div>
          <dt>Quieren adoptar</dt>
          <dd className={propios.cifra}>
            <Cifra valor={c.postulaciones} />
          </dd>
          <dd>{plural(c.fichas, "animal en adopción", "animales en adopción")}</dd>
        </div>
      </dl>

      {(conIA || resumen) && (
        <section className={propios.resumen} aria-labelledby="resumen">
          <div className={propios.resumenTitulo}>
            <h2 id="resumen">Resumen para el equipo</h2>
            <span className={propios.insignia}>
              <Icono nombre="info" tamano={14} />
              Escrito con inteligencia artificial
            </span>
          </div>
          {resumen ? (
            <>
              <p className={propios.resumenTexto}>{resumen.texto}</p>
              <p className="nota">
                Con las cifras de esta página al {fechaCorta(resumen.creadoEn)}, <span className="dato">{hora(resumen.creadoEn)}</span>. Revísalo antes de decidir.
              </p>
            </>
          ) : (
            <p className="nota">Un párrafo con lo que destaca y dónde. Solo se envían las cifras agrupadas, nunca datos de personas.</p>
          )}
          {conIA && <BotonAccion accion={generarResumen} texto={resumen ? "Actualizar resumen" : "Generar resumen"} />}
        </section>
      )}

      <div className={estilos.grillaDos}>
        <section className={estilos.panel} aria-labelledby="servicios">
          <h2 id="servicios">Qué servicios piden</h2>
          {d.porServicio.length === 0 ? (
            <p>No hay solicitudes pendientes.</p>
          ) : (
            <ul className={propios.barras}>
              {d.porServicio.map((s) => (
                <li key={s.nombre}>
                  <span>{s.nombre}</span>
                  <span className={propios.pista} aria-hidden="true">
                    <span className={propios.barra} style={{ width: `${(s.cantidad / maximo) * 100}%` }} />
                  </span>
                  <b>{numero(s.cantidad)}</b>
                </li>
              ))}
            </ul>
          )}
          <p className="nota">
            {plural(c.inscritos, "persona inscrita", "personas inscritas")} en operativos próximos · {plural(c.comunitarios, "perro comunitario", "perros comunitarios")} a cargo de vecinos
          </p>
        </section>

        <section className={estilos.panel} aria-labelledby="sos">
          <h2 id="sos">Qué reportan por SOS</h2>
          {d.porTipo.length === 0 ? (
            <p>Sin reportes en los últimos 30 días.</p>
          ) : (
            <ul className={estilos.listaSimple}>
              {d.porTipo.map((t) => (
                <li key={t.nombre}>
                  <b>{numero(t.cantidad)}</b> · {t.nombre}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={estilos.seccion} aria-labelledby="sectores">
        <h2 id="sectores">Dónde</h2>
        <div className={piezas.desplazable}>
          <table className={piezas.tabla}>
            <thead>
              <tr>
                <th scope="col">Sector</th>
                <th scope="col" className={piezas.numero}>Solicitudes</th>
                <th scope="col" className={piezas.numero}>Reportes SOS (30 días)</th>
                <th scope="col" className={piezas.numero}>Avisos de mascotas</th>
              </tr>
            </thead>
            <tbody>
              {d.porSector.map((s) => (
                <tr key={s.nombre}>
                  <th scope="row">{s.nombre}</th>
                  <td className={piezas.numero}>{numero(s.solicitudes)}</td>
                  <td className={piezas.numero}>{numero(s.reportes)}</td>
                  <td className={piezas.numero}>{numero(s.avisos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
