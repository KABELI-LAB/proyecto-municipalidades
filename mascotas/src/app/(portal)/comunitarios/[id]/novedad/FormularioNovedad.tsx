"use client";
// «Informar una novedad» de un perro comunitario: un vecino cuenta lo que vio y
// le llega a quien lo cuida, sin ver su contacto. Lo urgente va por SOS Mascotas.
import { useState } from "react";
import { BloquePersona, filasPersona, PERSONA_VACIA, type SectorOpcion } from "@/componentes/formulario/Bloques";
import { CampoArea, CampoOpciones } from "@/componentes/formulario/Campos";
import { MarcoPasos, Resumen } from "@/componentes/formulario/MarcoPasos";
import { ResultadoTramite } from "@/componentes/formulario/ResultadoTramite";
import { useTramite } from "@/componentes/formulario/useTramite";
import { TIPO_NOVEDAD, TIPOS_VECINO } from "@/dominio/comunitarios";
import { esquemaNovedad } from "@/lib/esquemas";
import { informarNovedad } from "@/servidor/portal/acciones";

const TITULOS = ["Qué novedad tienes", "Tus datos", "Revisa y confirma"] as const;
const PASOS = [["tipo", "texto"], ["nombre", "telefono", "correo", "localidadId"], []] as const;

export function FormularioNovedad({ perroId, nombre, sectores }: { perroId: string; nombre: string; sectores: SectorOpcion[] }) {
  const t = useTramite(esquemaNovedad, { perroId, tipo: "", texto: "", ...PERSONA_VACIA }, PASOS);
  const [resultado, setResultado] = useState<string | null>(null);
  const { valores: v, errores, cambiar } = t;

  if (resultado) {
    return (
      <ResultadoTramite titulo="Recibimos tu novedad" codigo={resultado} conRut={false}>
        <p>Se la enviamos a quien cuida a {nombre}; no verá tu teléfono ni tu correo. Si el perro está herido y es urgente, usa también SOS Mascotas.</p>
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
      alConfirmar={() =>
        t.enviar(
          (valores) => informarNovedad(valores),
          (r) => setResultado(r.codigo),
        )
      }
      textoConfirmar="Enviar novedad"
    >
      {t.paso === 0 && (
        <>
          <CampoOpciones
            id="tipo"
            etiqueta={`¿Qué quieres informar sobre ${nombre}?`}
            valor={v.tipo}
            alCambiar={(x) => cambiar("tipo", x)}
            error={errores.tipo}
            opciones={TIPOS_VECINO.map((x) => ({ valor: x, texto: TIPO_NOVEDAD[x] }))}
          />
          <CampoArea
            id="texto"
            etiqueta="Cuéntanos qué viste"
            valor={v.texto}
            alCambiar={(x) => cambiar("texto", x)}
            error={errores.texto}
            maxLength={600}
            ayuda={v.tipo === "CORRECCION" ? "Indica qué dato está mal y cuál es el correcto." : "Por ejemplo, desde cuándo, cómo se ve o qué necesita. No indiques direcciones exactas."}
          />
        </>
      )}

      {t.paso === 1 && (
        <>
          <p>No se publican ni se los mostramos a quien lo cuida.</p>
          <BloquePersona valores={v} errores={errores} cambiar={cambiar} sectores={sectores} rut="no" />
        </>
      )}

      {t.paso === 2 && (
        <Resumen
          filas={[
            ["Novedad", TIPO_NOVEDAD[v.tipo] ?? ""],
            ["Detalle", v.texto],
            ...filasPersona(v, sectores),
          ]}
        />
      )}
    </MarcoPasos>
  );
}
