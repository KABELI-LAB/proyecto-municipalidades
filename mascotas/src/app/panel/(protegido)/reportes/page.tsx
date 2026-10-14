import type { Metadata } from "next";
import Link from "next/link";
import { Boton } from "@/componentes/Boton";
import { EtiquetaEstado } from "@/componentes/EtiquetaEstado";
import { BotonAccion } from "@/componentes/panel/BotonAccion";
import { CANTIDAD_ANIMALES, ESPECIE, ESTADO_REPORTE, SI_NO_SE } from "@/dominio/etiquetas";
import { puede } from "@/dominio/permisos";
import { requerir } from "@/servidor/auth";
import { fechaCorta, haceDias, hora } from "@/servidor/formato";
import { cerrarReporte, reabrirReporte, revisarReporte } from "@/servidor/panel/acciones-bandejas";
import { contarReportes, reportesBandeja, type GrupoReportes } from "@/servidor/panel/bandejas";
import { sectores } from "@/servidor/portal/consultas";
import estilos from "@/estilos/paginas.module.css";
import propios from "./reportes.module.css";

export const metadata: Metadata = { title: "Reportes · Panel municipal" };

const PESTANAS: { clave: GrupoReportes; texto: string }[] = [
  { clave: "ABIERTO", texto: "Sin revisar" },
  { clave: "EN_REVISION", texto: "En revisión" },
  { clave: "CERRADO", texto: "Cerrados" },
];

// Responde: ¿qué situaciones reportó la ciudadanía y cuáles siguen abiertas?
export default async function ReportesPanel({ searchParams }: { searchParams: Promise<{ ver?: string; sector?: string }> }) {
  const usuario = await requerir("verReportes");
  const f = await searchParams;
  const grupo = PESTANAS.find((p) => p.clave === f.ver)?.clave ?? "ABIERTO";
  const lista = await sectores();
  const sector = lista.find((s) => s.clave === f.sector);
  const [reportes, cuenta] = await Promise.all([reportesBandeja(grupo, sector?.id), contarReportes()]);
  const gestiona = puede(usuario.rol, "gestionarReportes");
  const enlace = (ver: string) => `/panel/reportes?${new URLSearchParams({ ver, ...(sector ? { sector: sector.clave } : {}) })}`;

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <h1>Reportes</h1>
        <p>Situaciones informadas en SOS Mascotas. Primero las que la persona percibió como urgentes; luego, las que llevan más tiempo esperando.</p>
        <details className={estilos.plegable}>
          <summary>Sector: {sector?.nombre ?? "Todos"}</summary>
          <form className={estilos.filtros} method="get" aria-label="Filtrar por sector">
            <input type="hidden" name="ver" value={grupo} />
            <label>
              Sector
              <select name="sector" defaultValue={sector?.clave ?? ""}>
                <option value="">Todos los sectores</option>
                {lista.map((s) => (
                  <option key={s.id} value={s.clave}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </label>
            <Boton type="submit" variante="secundario">
              Filtrar
            </Boton>
          </form>
        </details>
      </div>

      <nav aria-label="Estado de los reportes" className={estilos.pestanas}>
        {PESTANAS.map((p) => (
          <Link key={p.clave} href={enlace(p.clave)} aria-current={p.clave === grupo ? "page" : undefined} replace>
            {p.texto} ({cuenta[p.clave]})
          </Link>
        ))}
      </nav>

      {reportes.length === 0 ? (
        <div className={estilos.vacio}>
          <p>No hay reportes en esta bandeja{sector ? ` para ${sector.nombre}` : ""}.</p>
        </div>
      ) : (
        <div className={estilos.grilla}>
          {reportes.map((r) => (
            <article key={r.id} className={estilos.panel}>
              <div className={propios.etiquetas}>
                <EtiquetaEstado estado={ESTADO_REPORTE[r.estado]} />
              </div>
              <h2>{r.tipo.nombre}</h2>
              <p>
                {r.sector.nombre}
                {r.lugar ? ` · ${r.lugar.nombre}` : r.localidad ? ` · ${r.localidad.nombre}` : ""} · {fechaCorta(r.creadoEn)} ({haceDias(r.creadoEn)})
              </p>
              <p>{r.descripcion}</p>
              {r.tieneFoto && (
                <a href={`/panel/reportes/${r.id}/foto`} target="_blank" rel="noopener" className={propios.foto}>
                  {/* Foto privada: se entrega con permiso, sin pasar por el optimizador público de imágenes. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/panel/reportes/${r.id}/foto`} alt={`Foto enviada con el reporte: ${r.tipo.nombre.toLowerCase()}`} loading="lazy" />
                  <span>Ver la foto completa</span>
                </a>
              )}
              {(r.especie || r.cantidad || r.sigueEnLugar) && (
                <dl className={estilos.datos}>
                  {r.especie && (
                    <>
                      <dt>Especie</dt>
                      <dd>{ESPECIE[r.especie]}</dd>
                    </>
                  )}
                  {r.cantidad && (
                    <>
                      <dt>Animales</dt>
                      <dd>{CANTIDAD_ANIMALES[r.cantidad]}</dd>
                    </>
                  )}
                  {r.sigueEnLugar && (
                    <>
                      <dt>Sigue en el lugar</dt>
                      <dd>{SI_NO_SE[r.sigueEnLugar]}</dd>
                    </>
                  )}
                </dl>
              )}
              {r.codigo && <p className="nota">Código {r.codigo}</p>}
              {r.historial.length > 0 && (
                <details className={propios.historial}>
                  <summary>Historial ({r.historial.length})</summary>
                  <ol>
                    {r.historial.map((h, i) => (
                      <li key={i}>
                        <b>{ESTADO_REPORTE[h.estado].texto}</b> · {fechaCorta(h.creadoEn)}, {hora(h.creadoEn)} · {h.usuario ? h.usuario.nombre : "Persona que reportó"}
                      </li>
                    ))}
                  </ol>
                </details>
              )}
              {gestiona && (
                <div className={estilos.accionesCabecera}>
                  {r.estado === "ABIERTO" && <BotonAccion accion={revisarReporte.bind(null, r.id)} texto="Pasar a revisión" variante="primario" />}
                  {r.estado !== "CERRADO" && <BotonAccion accion={cerrarReporte.bind(null, r.id)} texto="Cerrar reporte" confirmar="Se avisará a quien reportó que su reporte fue revisado. ¿Desea cerrarlo?" textoConfirmar="Sí, cerrar" />}
                  {r.estado === "CERRADO" && <BotonAccion accion={reabrirReporte.bind(null, r.id)} texto="Volver a revisión" />}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      <p className="nota">La identidad de quien reporta no se muestra en el panel.</p>
    </div>
  );
}
