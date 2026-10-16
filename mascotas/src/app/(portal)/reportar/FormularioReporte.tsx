"use client";
import { useState } from "react";
import { BloquePersona, CampoLocalidad, CAMPOS_PERSONA, filasPersona, PERSONA_VACIA, type SectorOpcion } from "@/componentes/formulario/Bloques";
import { CampoArea, CampoFoto, CampoOpciones, CampoSelect } from "@/componentes/formulario/Campos";
import { MarcoPasos, Resumen } from "@/componentes/formulario/MarcoPasos";
import { ResultadoTramite } from "@/componentes/formulario/ResultadoTramite";
import { useTramite } from "@/componentes/formulario/useTramite";
import { CANTIDAD_ANIMALES, ESPECIE, SI_NO_SE } from "@/dominio/etiquetas";
import { esquemaReporte, PREGUNTA_SI_SIGUE } from "@/lib/esquemas";
import { reportarSituacion } from "@/servidor/portal/acciones";
import estilos from "@/componentes/formulario/formulario.module.css";

const TITULOS = ["Qué está ocurriendo", "Detalle y tus datos", "Revisa y confirma"] as const;
const PASOS = [["tipo"], ["localidadId", "especie", "cantidad", "sigueEnLugar", "descripcion", "foto", ...CAMPOS_PERSONA.filter((c) => c !== "localidadId")], []] as const;

// Qué conviene contar según la categoría (claves de demo/datos/catalogos.json).
const AYUDA_DESCRIPCION: Record<string, string> = {
  "animal herido": "Por ejemplo, qué lesión o síntoma se ve, si puede caminar y desde cuándo está ahí.",
  "maltrato o abandono": "Por ejemplo, qué has visto, desde cuándo y si el animal tiene agua y refugio.",
  "animal agresivo": "Por ejemplo, cuántos animales son, a qué hora se ven y si han atacado a alguien.",
  "animal comunitario sin atencion": "Por ejemplo, si los vecinos lo alimentan y qué atención necesita.",
  "animal atrapado": "Por ejemplo, dónde está atrapado de forma general (un canal, un techo, un cerco) y desde cuándo.",
  otro: "Por ejemplo, qué está ocurriendo y desde cuándo.",
};

export function FormularioReporte({ sectores, tipos, tipoInicial = "" }: { sectores: SectorOpcion[]; tipos: { clave: string; nombre: string }[]; tipoInicial?: string }) {
  const t = useTramite(esquemaReporte, { tipo: tipoInicial, especie: "", cantidad: "", sigueEnLugar: "", descripcion: "", ...PERSONA_VACIA }, PASOS);
  const [codigo, setCodigo] = useState<string | null>(null);
  // La foto viaja aparte de los campos de texto, en el mismo envío.
  const [foto, setFoto] = useState<Blob | null>(null);
  const { valores: v, errores, cambiar } = t;
  const preguntaLugar = PREGUNTA_SI_SIGUE.includes(v.tipo);
  const varios = v.cantidad !== "" && v.cantidad !== "UNO";

  if (codigo) {
    return (
      <ResultadoTramite titulo="Recibimos tu reporte" codigo={codigo} conRut={false}>
        <p>El equipo municipal lo revisará en horario de atención.</p>
        <p>
          <b>No garantiza atención inmediata. Si hay peligro para una persona, llama a los servicios de emergencia.</b>
        </p>
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
          (v) => {
            const datos = new FormData();
            datos.set("datos", JSON.stringify(v));
            if (foto) datos.set("foto", foto, "foto.jpg");
            return reportarSituacion(datos);
          },
          (r) => setCodigo(r.codigo),
        )
      }
      textoConfirmar="Enviar reporte"
    >
      {t.paso === 0 && (
        <>
          <CampoOpciones
            id="tipo"
            etiqueta="¿Qué situación quieres informar?"
            valor={v.tipo}
            alCambiar={(x) => cambiar("tipo", x)}
            error={errores.tipo}
            opciones={tipos.map((t) => ({ valor: t.clave, texto: t.nombre }))}
          />
        </>
      )}
      {t.paso === 1 && (
        <>
          <CampoLocalidad
            etiqueta="Localidad donde ocurre"
            valor={v.localidadId}
            alCambiar={(x) => cambiar("localidadId", x)}
            error={errores.localidadId}
            sectores={sectores}
            ayuda="Elige la localidad más cercana. No indiques direcciones."
          />
          <CampoSelect
            id="especie"
            etiqueta="Especie"
            opcional
            valor={v.especie}
            alCambiar={(x) => cambiar("especie", x)}
            error={errores.especie}
            opciones={Object.entries(ESPECIE).map(([valor, texto]) => ({ valor, texto }))}
          />
          <CampoOpciones
            id="cantidad"
            etiqueta="¿Cuántos animales hay?"
            valor={v.cantidad}
            alCambiar={(x) => cambiar("cantidad", x)}
            error={errores.cantidad}
            opciones={Object.entries(CANTIDAD_ANIMALES).map(([valor, texto]) => ({ valor, texto }))}
            columnas={3}
          />
          {preguntaLugar && (
            <CampoOpciones
              id="sigueEnLugar"
              etiqueta={varios ? "¿Los animales siguen en el lugar?" : "¿El animal sigue en el lugar?"}
              valor={v.sigueEnLugar}
              alCambiar={(x) => cambiar("sigueEnLugar", x)}
              error={errores.sigueEnLugar}
              opciones={Object.entries(SI_NO_SE).map(([valor, texto]) => ({ valor, texto }))}
              columnas={3}
            />
          )}
          <CampoArea
            id="descripcion"
            etiqueta="Qué está ocurriendo"
            valor={v.descripcion}
            alCambiar={(x) => cambiar("descripcion", x)}
            error={errores.descripcion}
            maxLength={600}
            ayuda={`${AYUDA_DESCRIPCION[v.tipo] ?? ""} Puedes indicar un punto de referencia general, como «cerca de la sede social», pero no direcciones exactas.`}
          />
          <CampoFoto
            id="foto"
            etiqueta="Foto del animal o de la situación"
            opcional
            archivo={foto}
            alCambiar={setFoto}
            error={errores.foto}
            ayuda="Solo la ve el equipo municipal. Evita que aparezcan personas, patentes o el interior de una casa."
          />
          <h3 className={estilos.subtitulo}>Tus datos</h3>
          <p>Los usamos solo para darte seguimiento. Tu identidad no se comparte con otras personas.</p>
          <BloquePersona valores={v} errores={errores} cambiar={cambiar} sectores={sectores} sinLocalidad rut="no" />
        </>
      )}
      {t.paso === 2 && (
        <Resumen
          filas={[
            ["Situación", tipos.find((t) => t.clave === v.tipo)?.nombre ?? ""],
            ["Especie", ESPECIE[v.especie] ?? ""],
            ["Cantidad de animales", CANTIDAD_ANIMALES[v.cantidad] ?? ""],
            ...(preguntaLugar ? [["Sigue en el lugar", SI_NO_SE[v.sigueEnLugar] ?? ""] as [string, string]] : []),
            ["Descripción", v.descripcion],
            ["Foto", foto ? "Adjunta" : "Sin foto"],
            ...filasPersona(v, sectores, "Dónde ocurre"),
          ]}
        />
      )}
    </MarcoPasos>
  );
}
