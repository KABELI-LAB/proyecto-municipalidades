import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnlaceBoton } from "@/componentes/Boton";
import { GaleriaOperativo } from "@/componentes/GaleriaOperativo";
import { Icono } from "@/componentes/Icono";
import { municipioActivo } from "@/lib/municipio";
import { fechaLarga } from "@/servidor/formato";
import { operativo as buscarOperativo, territorio } from "@/servidor/portal/consultas";
import estilos from "@/componentes/portal/operativos.module.css";
import paginas from "@/estilos/paginas.module.css";
import { FormularioCupo } from "./FormularioCupo";

export const metadata: Metadata = { title: "Inscripción en operativo" };

// Responde: ¿cómo me inscribo en este operativo? Solo el formulario: los cupos
// están en las tarjetas de servicio y la fecha, el lugar y los requisitos en
// el paso «Confirmar».
export default async function PaginaOperativo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [o, lista] = await Promise.all([buscarOperativo(id), territorio()]);
  if (!o) notFound();
  const requisitos = o.requisitos || "Presentar cédula de identidad. Los requisitos específicos se informarán en [fecha].";
  const fecha = capitalizar(fechaLarga(o.fecha));
  const lugar = `${o.lugar.nombre}${o.lugar.localidad ? `, ${o.lugar.localidad.nombre}` : ""}`;

  return (
    <div className={`contenedor ${paginas.pagina}`}>
      {/* Título para lectores de pantalla; en pantalla manda el formulario. */}
      <h1 className="visualmente-oculto">
        Inscripción en el operativo en {o.sector.nombre}, {fecha}
      </h1>
      <section className={estilos.zonaFormulario} aria-label="Inscripción">
        {o.inscripcionAbierta ? (
          <FormularioCupo
            operativoId={o.id}
            sectores={lista}
            servicios={o.servicios.map((s) => ({ id: s.servicioId, nombre: s.nombre, clave: s.clave, disponibles: s.disponibles }))}
            requisitos={requisitos}
            limitePorHogar={municipioActivo().parametros.limitePorHogar}
            operativo={{ fecha, horario: `${o.horaInicio} a ${o.horaFin} horas`, lugar }}
          />
        ) : (
          <div className={estilos.vacio}>
            <span className={estilos.vacioIcono} aria-hidden="true">
              <Icono nombre="calendario" tamano={40} />
            </span>
            <h2>{o.estado === "CERRADO" ? "Este operativo ya se realizó" : o.estado === "EN_CURSO" ? "Este operativo está en curso" : "Las inscripciones están cerradas"}</h2>
            <p>Cuéntanos qué servicio necesitas: nos ayuda a decidir dónde hacer los próximos operativos.</p>
            <EnlaceBoton href="/servicio">Solicitar un servicio</EnlaceBoton>
            <Link href="/operativos">Ver otros operativos</Link>
          </div>
        )}
      </section>

      {o.estado === "CERRADO" && o.fotos && (
        <section className={paginas.seccion} aria-labelledby="fotos">
          <h2 id="fotos">Fotos del operativo</h2>
          <GaleriaOperativo fotos={o.fotos} sector={o.sector.nombre} />
        </section>
      )}
    </div>
  );
}

const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
