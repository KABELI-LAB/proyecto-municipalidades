import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EtiquetaEstado } from "@/componentes/EtiquetaEstado";
import { ESPECIE, ESTADO_OPERATIVO, SEXO } from "@/dominio/etiquetas";
import { requerir } from "@/servidor/auth";
import { fechaLarga, hora } from "@/servidor/formato";
import { listaTerreno, puedeOperar } from "@/servidor/panel/operativos";
import estilos from "./asistencia.module.css";
import { ListaAsistencia } from "./ListaAsistencia";

export const metadata: Metadata = { title: "Asistencia · Panel municipal" };

// Responde: ¿quién llegó y qué atención recibió?
export default async function AsistenciaOperativo({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await requerir("registrarAtenciones");
  const { id } = await params;
  if (!(await puedeOperar(usuario, id))) redirect(`/panel/operativos/${id}`);
  const datos = await listaTerreno(id);
  if (!datos) notFound();
  const { operativo: o } = datos;

  return (
    <div className={estilos.pila}>
      <div>
        <EtiquetaEstado estado={ESTADO_OPERATIVO[o.estado]} />
        <h1>{o.sector.nombre}</h1>
        <p>
          {fechaLarga(o.fecha)} · {o.horaInicio} a {o.horaFin} horas · {o.lugar.nombre}
        </p>
      </div>
      {o.estado !== "EN_CURSO" && (
        <p className={estilos.aviso} role="note">
          {o.estado === "CERRADO" ? "El operativo está cerrado; ya no se registran atenciones." : "El operativo aún no está en curso. Puede revisar la lista; para registrar, inícielo desde su ficha."}
        </p>
      )}
      <ListaAsistencia
        operativoId={o.id}
        enCurso={o.estado === "EN_CURSO"}
        servicios={o.capacidades.map((c) => ({ id: c.servicioId, nombre: c.servicio.nombre }))}
        cupos={datos.cupos.map((c) => ({
          id: c.id,
          codigo: c.codigo,
          servicioId: c.servicioId,
          servicio: c.servicio.nombre,
          persona: c.persona.nombre,
          animal: `${c.animal.nombre ?? "Sin nombre"} · ${ESPECIE[c.animal.especie].toLowerCase()} · ${SEXO[c.animal.sexo].toLowerCase()}`,
          estado: c.estado,
          atencion: c.atencion ? { resultado: c.atencion.resultado, observaciones: c.atencion.observaciones } : null,
        }))}
        espontaneas={datos.espontaneas.map((a) => ({
          id: a.id,
          texto: `${a.servicio.nombre} · ${a.animal?.nombre ?? "Sin nombre"} (${ESPECIE[a.especie].toLowerCase()}) · ${hora(a.realizadaEn)}`,
        }))}
      />
    </div>
  );
}
