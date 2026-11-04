"use client";
import Link from "next/link";
import { useState } from "react";
import { ANIMAL_VACIO, BloqueAnimal, BloquePersona, CAMPOS_ANIMAL, CAMPOS_PERSONA, filasAnimal, filasPersona, AYUDA_ESPECIE_ATENDIDA, OPCIONES_ESPECIE_ATENDIDA, PERSONA_VACIA, type SectorOpcion } from "@/componentes/formulario/Bloques";
import { CampoOpciones } from "@/componentes/formulario/Campos";
import { MarcoPasos, Resumen } from "@/componentes/formulario/MarcoPasos";
import { ResultadoTramite } from "@/componentes/formulario/ResultadoTramite";
import { useTramite } from "@/componentes/formulario/useTramite";
import { esquemaServicio } from "@/lib/esquemas";
import { solicitarServicio, type ResultadoServicio } from "@/servidor/portal/acciones";
import estilos from "@/componentes/formulario/formulario.module.css";

type Props = { sectores: SectorOpcion[]; servicios: { id: string; nombre: string; clave: string }[] };

const TITULOS = ["Qué necesitas", "Datos del animal y tuyos", "Revisa y confirma"] as const;
const PASOS = [["servicioId", "especie"], [...CAMPOS_ANIMAL, ...CAMPOS_PERSONA], []] as const;

const DESCRIPCION: Record<string, string> = {
  esterilizacion: "Evita camadas no deseadas.",
  "vacuna-antirrabica": "Protege contra la rabia.",
  microchip: "Permite identificar al animal si se pierde.",
};

export function FormularioServicio({ sectores, servicios }: Props) {
  const t = useTramite(esquemaServicio, { servicioId: "", ...ANIMAL_VACIO, ...PERSONA_VACIA }, PASOS);
  const [hecho, setHecho] = useState<Extract<ResultadoServicio, { ok: true }> | null>(null);
  const { valores: v, errores, cambiar } = t;

  if (hecho) {
    return (
      <ResultadoTramite titulo="Tu solicitud fue recibida">
        {hecho.operativo ? (
          <p>
            Hay un operativo publicado en {hecho.operativo.sector} el {hecho.operativo.fecha} que ofrece{" "}
            {hecho.servicio.toLowerCase()}. <Link href={`/operativos/${hecho.operativo.id}`}>Puedes solicitar un cupo aquí</Link>.
          </p>
        ) : (
          <p>
            Registramos tu solicitud. Nos ayuda a decidir dónde hacer los próximos operativos; revisa la sección
            Operativos para inscribirte cuando haya uno cerca.
          </p>
        )}
      </ResultadoTramite>
    );
  }

  return (
    <MarcoPasos
      titulos={TITULOS}
      paso={t.paso}
      tituloRef={t.titulo}
      mensaje={t.mensaje}
      enviando={t.enviando}
      alAvanzar={t.avanzar}
      alVolver={t.volver}
      alConfirmar={() => t.enviar(solicitarServicio, setHecho)}
    >
      {t.paso === 0 && (
        <>
          <CampoOpciones
            id="servicioId"
            etiqueta="Servicio"
            valor={v.servicioId}
            alCambiar={(x) => cambiar("servicioId", x)}
            error={errores.servicioId}
            opciones={servicios.map((s) => ({ valor: s.id, texto: s.nombre, descripcion: DESCRIPCION[s.clave] }))}
            columnas={3}
          />
          <CampoOpciones id="especie" etiqueta="Especie" valor={v.especie} alCambiar={(x) => cambiar("especie", x)} error={errores.especie} opciones={OPCIONES_ESPECIE_ATENDIDA} ayuda={AYUDA_ESPECIE_ATENDIDA} />
        </>
      )}
      {t.paso === 1 && (
        <>
          <BloqueAnimal valores={v} errores={errores} cambiar={cambiar} />
          <h3 className={estilos.subtitulo}>Tus datos</h3>
          <BloquePersona valores={v} errores={errores} cambiar={cambiar} sectores={sectores} rut="opcional" />
        </>
      )}
      {t.paso === 2 && (
        <Resumen
          filas={[
            ["Servicio", servicios.find((s) => s.id === v.servicioId)?.nombre ?? ""],
            ...filasAnimal(v),
            ...filasPersona(v, sectores),
          ]}
        />
      )}
    </MarcoPasos>
  );
}
