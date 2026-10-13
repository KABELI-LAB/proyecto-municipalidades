import type { Metadata } from "next";
import { municipioActivo } from "@/lib/municipio";
import { requerir } from "@/servidor/auth";
import { db } from "@/servidor/db";
import { diaISO } from "@/servidor/formato";
import { demandaPorSector } from "@/servidor/panel/operativos";
import estilos from "@/estilos/paginas.module.css";
import { FormularioRapido } from "./FormularioRapido";

export const metadata: Metadata = { title: "Crear operativo · Panel municipal" };

// Responde: ¿dónde, cuándo y cuántos cupos? Se publica de una vez.
export default async function NuevoOperativo() {
  await requerir("gestionarOperativos");
  const municipio = municipioActivo();
  const [lugares, servicios, demanda] = await Promise.all([
    db.lugar.findMany({
      where: { sector: { municipioId: municipio.id } },
      select: { id: true, nombre: true, sectorId: true, sector: { select: { nombre: true } } },
      orderBy: [{ sector: { orden: "asc" } }, { nombre: "asc" }],
    }),
    db.servicio.findMany({ where: { municipioId: municipio.id, activo: true }, orderBy: { nombre: "asc" } }),
    demandaPorSector(),
  ]);

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <h1>Crear operativo</h1>
      <FormularioRapido
        lugares={lugares.map((l) => ({ valor: l.id, texto: l.nombre, grupo: `Sector ${l.sector.nombre}`, sectorId: l.sectorId }))}
        servicios={servicios.map((s) => ({ id: s.id, nombre: s.nombre }))}
        demanda={demanda}
        hoy={diaISO(new Date())}
      />
    </div>
  );
}
