import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { municipioActivo } from "@/lib/municipio";
import { requerir } from "@/servidor/auth";
import { db } from "@/servidor/db";
import { diaISO } from "@/servidor/formato";
import { demandaPorSector, lugares } from "@/servidor/panel/operativos";
import estilos from "@/estilos/paginas.module.css";
import { FormularioOperativo } from "../../FormularioOperativo";

export const metadata: Metadata = { title: "Editar operativo · Panel municipal" };

export default async function EditarOperativo({ params }: { params: Promise<{ id: string }> }) {
  await requerir("gestionarOperativos");
  const { id } = await params;
  const municipio = municipioActivo();
  const o = await db.operativo.findFirst({ where: { id, sector: { municipioId: municipio.id } }, include: { capacidades: true } });
  if (!o) notFound();
  if (o.estado !== "BORRADOR") redirect(`/panel/operativos/${id}`);
  const [sectores, servicios, demanda] = await Promise.all([
    db.sector.findMany({ where: { municipioId: municipio.id }, orderBy: { orden: "asc" } }),
    db.servicio.findMany({ where: { municipioId: municipio.id, activo: true }, orderBy: { nombre: "asc" } }),
    demandaPorSector(),
  ]);
  const listaLugares = await lugares();

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <h1>Editar borrador</h1>
      </div>
      <FormularioOperativo
        sectores={sectores.map((s) => ({ id: s.id, nombre: s.nombre }))}
        lugares={listaLugares}
        servicios={servicios.map((s) => ({ id: s.id, nombre: s.nombre }))}
        demanda={demanda}
        origen={o.origen}
        hoy={diaISO(new Date())}
        inicial={{
          id: o.id,
          sectorId: o.sectorId,
          lugarId: o.lugarId,
          fecha: diaISO(o.fecha),
          horaInicio: o.horaInicio,
          horaFin: o.horaFin,
          requisitos: o.requisitos,
          capacidades: Object.fromEntries(o.capacidades.map((c) => [c.servicioId, c.cupos])),
        }}
      />
    </div>
  );
}
