import type { Metadata } from "next";
import Link from "next/link";
import { EnlaceBoton } from "@/componentes/Boton";
import { EtiquetaEstado } from "@/componentes/EtiquetaEstado";
import { ESTADO_OPERATIVO } from "@/dominio/etiquetas";
import { numero, porcentaje } from "@/dominio/formato";
import { puede } from "@/dominio/permisos";
import { requerir } from "@/servidor/auth";
import { fechaCorta, fechaLarga } from "@/servidor/formato";
import { listaOperativos } from "@/servidor/panel/operativos";
import estilos from "@/estilos/paginas.module.css";
import piezas from "@/componentes/panel/piezas.module.css";

export const metadata: Metadata = { title: "Operativos · Panel municipal" };

export default async function PaginaOperativos() {
  const usuario = await requerir("verOperativos");
  const { programados, cerrados, cancelados } = await listaOperativos();

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.barraTitulo}>
        <h1>Operativos</h1>
        {puede(usuario.rol, "gestionarOperativos") && <EnlaceBoton href="/panel/operativos/nuevo">Crear operativo</EnlaceBoton>}
      </div>

      <section className={estilos.seccion} aria-labelledby="programados">
        <h2 id="programados">Programados</h2>
        {programados.length > 0 ? (
          <div className={piezas.desplazable}>
            <table className={piezas.tabla}>
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Sector</th>
                  <th scope="col">Estado</th>
                  <th scope="col" className={piezas.numero}>Cupos ocupados</th>
                  <th scope="col" className={piezas.numero}>En espera</th>
                </tr>
              </thead>
              <tbody>
                {programados.map((o) => {
                  const capacidad = o.ocupacion.reduce((t, x) => t + x.capacidad, 0);
                  const ocupados = o.ocupacion.reduce((t, x) => t + x.ocupados, 0);
                  return (
                    <tr key={o.id}>
                      <th scope="row">
                        <Link href={`/panel/operativos/${o.id}`}>{fechaLarga(o.fecha)}</Link>
                      </th>
                      <td>{o.sector.nombre}</td>
                      <td>
                        <EtiquetaEstado estado={ESTADO_OPERATIVO[o.estado]} />
                      </td>
                      <td className={piezas.numero}>
                        {numero(ocupados)} de {numero(capacidad)} ({porcentaje(capacidad ? ocupados / capacidad : 0)})
                      </td>
                      <td className={piezas.numero}>{numero(o.ocupacion.reduce((t, x) => t + x.espera, 0))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={estilos.vacio}>
            <p>No hay operativos programados. Revisa el sector prioritario en el Resumen.</p>
          </div>
        )}
      </section>

      <section className={estilos.seccion} aria-labelledby="cerrados">
        <h2 id="cerrados">Cerrados</h2>
        <div className={piezas.desplazable}>
          <table className={piezas.tabla}>
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Sector</th>
                <th scope="col" className={piezas.numero}>Asistencia</th>
                <th scope="col" className={piezas.numero}>Atenciones</th>
                <th scope="col" className={piezas.numero}>Quedaron sin cupo</th>
              </tr>
            </thead>
            <tbody>
              {cerrados.map((o) => (
                <tr key={o.id}>
                  <th scope="row">
                    <Link href={`/panel/operativos/${o.id}`}>{fechaCorta(o.fecha)}</Link>
                  </th>
                  <td>{o.sector.nombre}</td>
                  <td className={piezas.numero}>
                    {o.resultado ? `${numero(o.resultado.asistentes)} de ${numero(o.resultado.inscritos)} (${porcentaje(o.resultado.inscritos ? o.resultado.asistentes / o.resultado.inscritos : 0)})` : "—"}
                  </td>
                  <td className={piezas.numero}>{o.resultado ? numero(o.resultado.atenciones) : "—"}</td>
                  <td className={piezas.numero}>{o.resultado ? numero(o.resultado.demandaNoCubierta) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {cancelados.length > 0 && (
        <section className={estilos.seccion} aria-labelledby="cancelados">
          <h2 id="cancelados">Cancelados</h2>
          <ul>
            {cancelados.map((o) => (
              <li key={o.id}>
                <Link href={`/panel/operativos/${o.id}`}>
                  {o.sector.nombre} · {fechaCorta(o.fecha)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
