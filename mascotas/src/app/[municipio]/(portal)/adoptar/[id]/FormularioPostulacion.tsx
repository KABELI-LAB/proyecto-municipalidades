"use client";
import { useState } from "react";
import { BloquePersona, CAMPOS_PERSONA, filasPersona, PERSONA_VACIA, type SectorOpcion } from "@/componentes/formulario/Bloques";
import { CampoCasillas, CampoOpciones, CampoTexto } from "@/componentes/formulario/Campos";
import { MarcoPasos, Resumen } from "@/componentes/formulario/MarcoPasos";
import { ResultadoTramite } from "@/componentes/formulario/ResultadoTramite";
import { useTramite } from "@/componentes/formulario/useTramite";
import { Icono } from "@/componentes/Icono";
import { esquemaPostulacion, TIPOS_VIVIENDA } from "@/lib/esquemas";
import { postularAdopcion } from "@/servidor/portal/acciones";
import estilos from "@/componentes/formulario/formulario.module.css";

/** `deVecino`: animal propuesto por un vecino; la postulación le llega a esa persona, no al municipio. */
type Props = { fichaId: string; nombre: string; convivencia: string; sectores: SectorOpcion[]; deVecino?: boolean };

const TITULOS = ["Tus datos", "Tu hogar", "Revisa y confirma"] as const;
const PASOS = [CAMPOS_PERSONA, ["tipoVivienda", "experiencia", "tieneOtros", "otrosAnimales", "compartir"], []] as const;
const mayuscula = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
const SI_NO = [
  { valor: "SI", texto: "Sí" },
  { valor: "NO", texto: "No" },
];

export function FormularioPostulacion({ fichaId, nombre, convivencia, sectores, deVecino = false }: Props) {
  const t = useTramite(esquemaPostulacion, { fichaId, ...PERSONA_VACIA, tipoVivienda: "", experiencia: "", tieneOtros: "", otrosAnimales: "", compartir: "" }, PASOS);
  const [codigo, setCodigo] = useState<string | null>(null);
  const { valores: v, errores, cambiar } = t;

  if (codigo) {
    return (
      <ResultadoTramite titulo="Recibimos tu postulación">
        {deVecino ? (
          <p>
            Le enviamos tu postulación a quien da en adopción a {nombre}. Si te elige, verás su contacto en Mis solicitudes y
            esa persona verá el tuyo.
          </p>
        ) : (
          <p>
            Revisaremos tu postulación para adoptar a {nombre} y te contactaremos para conversar. El estado puede ser En
            evaluación, Aprobada o No seleccionada.
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
      alConfirmar={() => t.enviar(postularAdopcion, (r) => setCodigo(r.codigo))}
      textoConfirmar="Enviar postulación"
    >
      {t.paso === 0 && <BloquePersona valores={v} errores={errores} cambiar={cambiar} sectores={sectores} />}
      {t.paso === 1 && (
        <>
          <CampoOpciones id="tipoVivienda" etiqueta="Tipo de vivienda" valor={v.tipoVivienda} alCambiar={(x) => cambiar("tipoVivienda", x)} error={errores.tipoVivienda} opciones={TIPOS_VIVIENDA.map((x) => ({ valor: x, texto: mayuscula(x) }))} />
          <CampoOpciones id="experiencia" etiqueta="¿Has tenido animales antes?" valor={v.experiencia} alCambiar={(x) => cambiar("experiencia", x)} error={errores.experiencia} opciones={SI_NO} />
          <CampoOpciones id="tieneOtros" etiqueta="¿Hay otros animales en tu hogar?" valor={v.tieneOtros} alCambiar={(x) => cambiar("tieneOtros", x)} error={errores.tieneOtros} opciones={SI_NO} />
          {v.tieneOtros === "SI" && (
            <>
              <CampoTexto id="otrosAnimales" etiqueta="¿Cuáles?" valor={v.otrosAnimales} alCambiar={(x) => cambiar("otrosAnimales", x)} error={errores.otrosAnimales} ayuda="Por ejemplo, «un perro adulto y dos gatos»." maxLength={100} />
              <div className={estilos.nota}>
                <Icono nombre="info" tamano={20} />
                <p>
                  <b>Sobre {nombre}:</b> {convivencia}
                </p>
              </div>
            </>
          )}
          {deVecino && (
            <CampoCasillas
              id="compartir"
              etiqueta="Contacto con quien lo da en adopción"
              valores={v.compartir === "SI" ? ["SI"] : []}
              alCambiar={(x) => cambiar("compartir", x.includes("SI") ? "SI" : "")}
              error={errores.compartir}
              ayuda="Tu postulación le llega a la persona que lo da en adopción, sin tu teléfono ni tu correo. Solo si te elige, compartimos los contactos de ambos."
              opciones={[{ valor: "SI", texto: "Acepto que, si me elige, compartan mi contacto con esa persona y el suyo conmigo." }]}
            />
          )}
        </>
      )}
      {t.paso === 2 && (
        <Resumen
          filas={[
            ["Animal", nombre],
            ...filasPersona(v, sectores),
            ["Tipo de vivienda", mayuscula(v.tipoVivienda)],
            ["Has tenido animales", v.experiencia === "SI" ? "Sí" : "No"],
            ["Otros animales en tu hogar", v.tieneOtros === "SI" ? v.otrosAnimales : "Ninguno"],
          ]}
        />
      )}
    </MarcoPasos>
  );
}
