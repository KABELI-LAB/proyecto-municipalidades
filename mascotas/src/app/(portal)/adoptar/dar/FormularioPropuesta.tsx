"use client";
// «Dar en adopción»: un vecino propone a un animal para que el municipio lo
// revise y lo publique. Todo antecedente admite «No sé». Las fotos viajan
// aparte de los campos de texto, en el mismo envío.
import { useState } from "react";
import { BloquePersona, CAMPOS_PERSONA, filasPersona, OPCIONES_ESPECIE, PERSONA_VACIA, type SectorOpcion } from "@/componentes/formulario/Bloques";
import { CampoArea, CampoCasillas, CampoFotos, CampoOpciones, CampoSelect, CampoTexto } from "@/componentes/formulario/Campos";
import { MarcoPasos, Resumen } from "@/componentes/formulario/MarcoPasos";
import { ResultadoTramite } from "@/componentes/formulario/ResultadoTramite";
import { Icono } from "@/componentes/Icono";
import { useTramite } from "@/componentes/formulario/useTramite";
import { ESPECIE, RELACION_ANIMAL, SEXO, SI_NO_SE, TAMANO } from "@/dominio/etiquetas";
import { edadEscrita, MAXIMO_FOTOS, mesesDeEdad } from "@/dominio/propuestas";
import { esquemaPropuesta } from "@/lib/esquemas";
import { proponerAdopcion } from "@/servidor/portal/acciones";
import estilos from "@/componentes/formulario/formulario.module.css";

const TITULOS = ["El animal", "Salud y cómo es", "Tus datos", "Revisa y confirma"] as const;
const PASOS = [
  ["fotos", "nombreAnimal", "especie", "sexo", "edad", "tamano"],
  ["esterilizado", "vacunas", "microchip", "caracter", "relacion"],
  [...CAMPOS_PERSONA, "autoriza"],
  [],
] as const;

export const PROPUESTA_VACIA = {
  corregir: "",
  nombreAnimal: "",
  especie: "",
  sexo: "",
  edad: "",
  tamano: "",
  esterilizado: "",
  vacunas: "",
  microchip: "",
  caracter: "",
  relacion: "",
  autoriza: "",
  ...PERSONA_VACIA,
};

const opciones = (mapa: Record<string, string>) => Object.entries(mapa).map(([valor, texto]) => ({ valor, texto }));
const SI_NO = opciones(SI_NO_SE);

/** La edad se escribe como número en años o meses; el esquema la guarda en meses («NO_SE» si no se sabe). */
type UnidadEdad = "ANOS" | "MESES" | "NO_SE";
const UNIDADES_EDAD = [
  { valor: "ANOS", texto: "Años" },
  { valor: "MESES", texto: "Meses" },
  { valor: "NO_SE", texto: "No se sabe" },
];
function edadInicial(edad: string): { numero: string; unidad: UnidadEdad } {
  if (edad === "NO_SE") return { numero: "", unidad: "NO_SE" };
  const meses = mesesDeEdad(edad);
  if (meses === null) return { numero: "", unidad: "ANOS" };
  return meses >= 12 && meses % 12 === 0 ? { numero: String(meses / 12), unidad: "ANOS" } : { numero: String(meses), unidad: "MESES" };
}

type Props = {
  sectores: SectorOpcion[];
  inicial?: typeof PROPUESTA_VACIA;
  /** Corrección: fotos ya guardadas y lo que pidió el municipio. */
  correccion?: { fotos: number; motivo: string };
};

export function FormularioPropuesta({ sectores, inicial = PROPUESTA_VACIA, correccion }: Props) {
  const t = useTramite(esquemaPropuesta, inicial, PASOS);
  const [fotos, setFotos] = useState<Blob[]>([]);
  const [errorFotos, setErrorFotos] = useState<string | undefined>();
  const [resultado, setResultado] = useState<{ codigo: string; corregida: boolean } | null>(null);
  const { valores: v, errores, cambiar } = t;
  const [edad, setEdad] = useState(() => edadInicial(inicial.edad));
  function cambiarEdad(numero: string, unidad: UnidadEdad) {
    setEdad({ numero, unidad });
    if (unidad === "NO_SE") return cambiar("edad", "NO_SE");
    if (!numero) return cambiar("edad", "");
    cambiar("edad", String(unidad === "ANOS" ? Number(numero) * 12 : Number(numero)));
  }

  if (resultado) {
    return (
      <ResultadoTramite titulo={resultado.corregida ? "Recibimos tu propuesta corregida" : "Recibimos tu propuesta"}>
        <p>
          El equipo municipal la revisará antes de publicarla en el catálogo de adopción. Puede que te pidamos corregir algún
          dato. Cuando esté publicada, revisa las postulaciones y elige en Mis solicitudes.
        </p>
      </ResultadoTramite>
    );
  }

  function avanzar() {
    // Las fotos no están en el esquema de texto: se revisan aquí antes de dejar el primer paso.
    const faltanFotos = t.paso === 0 && fotos.length === 0 && !correccion?.fotos;
    setErrorFotos(faltanFotos ? "Agrega al menos una foto del animal." : undefined);
    if (faltanFotos) return document.getElementById("fotos")?.focus();
    t.avanzar();
  }

  return (
    <MarcoPasos
      titulos={TITULOS}
      paso={t.paso}
      tituloRef={t.titulo}
      mensaje={t.mensaje}
      enviando={t.enviando}
      alAvanzar={avanzar}
      alVolver={t.volver}
      alConfirmar={() =>
        t.enviar(
          (valores) => {
            const datos = new FormData();
            datos.set("datos", JSON.stringify(valores));
            fotos.forEach((f, i) => datos.set(`foto${i}`, f, `foto${i}.jpg`));
            return proponerAdopcion(datos);
          },
          (r) => setResultado({ codigo: r.codigo, corregida: r.corregida }),
        )
      }
      textoConfirmar={correccion ? "Enviar la corrección" : "Enviar propuesta"}
    >
      {t.paso === 0 && (
        <>
          {correccion?.motivo && (
            <p className={estilos.aviso} role="note">
              <b>Lo que nos pidió corregir el municipio:</b> {correccion.motivo}
            </p>
          )}
          <CampoFotos
            id="fotos"
            etiqueta="Fotos del animal"
            archivos={fotos}
            alCambiar={(f) => {
              setFotos(f);
              if (f.length) setErrorFotos(undefined);
            }}
            maximo={MAXIMO_FOTOS}
            error={errorFotos ?? errores.fotos}
            opcional={Boolean(correccion?.fotos)}
            ayuda={
              correccion?.fotos
                ? `Ya tenemos ${correccion.fotos === 1 ? "1 foto" : `${correccion.fotos} fotos`}. Si agregas fotos nuevas, reemplazarán a las anteriores.`
                : `De 1 a ${MAXIMO_FOTOS} fotos en que se vea bien el animal. Evita que aparezcan personas, patentes o el interior de una casa.`
            }
          />
          <CampoTexto id="nombreAnimal" etiqueta="Nombre o apodo" opcional valor={v.nombreAnimal} alCambiar={(x) => cambiar("nombreAnimal", x)} error={errores.nombreAnimal} maxLength={40} />
          <div className={estilos.fila}>
            <CampoSelect id="especie" etiqueta="Especie" valor={v.especie} alCambiar={(x) => cambiar("especie", x)} error={errores.especie} opciones={OPCIONES_ESPECIE} />
            <CampoSelect id="sexo" etiqueta="Sexo" valor={v.sexo} alCambiar={(x) => cambiar("sexo", x)} error={errores.sexo} opciones={opciones(SEXO)} />
            <CampoSelect id="tamano" etiqueta="Tamaño" valor={v.tamano} alCambiar={(x) => cambiar("tamano", x)} error={errores.tamano} opciones={[...opciones(TAMANO), { valor: "NO_SE", texto: "No se sabe" }]} />
          </div>
          <div className={`${estilos.fila} ${estilos.filaCorta}`}>
            {edad.unidad !== "NO_SE" && (
              <CampoTexto
                id="edad"
                etiqueta="Edad aproximada"
                inputMode="numeric"
                maxLength={3}
                valor={edad.numero}
                alCambiar={(x) => cambiarEdad(x.replace(/\D/g, "").slice(0, 3), edad.unidad)}
                error={errores.edad}
              />
            )}
            <CampoSelect id="edadUnidad" etiqueta={edad.unidad === "NO_SE" ? "Edad aproximada" : "En"} valor={edad.unidad} alCambiar={(x) => cambiarEdad(edad.numero, (x || "ANOS") as UnidadEdad)} opciones={UNIDADES_EDAD} error={edad.unidad === "NO_SE" ? errores.edad : undefined} />
          </div>
        </>
      )}

      {t.paso === 1 && (
        <>
          <p>Si no conoces un dato, elige «No sé»: preferimos eso a un dato inexacto.</p>
          <CampoOpciones id="esterilizado" etiqueta="¿Está esterilizado?" valor={v.esterilizado} alCambiar={(x) => cambiar("esterilizado", x)} error={errores.esterilizado} opciones={SI_NO} columnas={3} />
          <CampoOpciones id="vacunas" etiqueta="¿Tiene sus vacunas al día?" valor={v.vacunas} alCambiar={(x) => cambiar("vacunas", x)} error={errores.vacunas} opciones={SI_NO} columnas={3} />
          <CampoOpciones id="microchip" etiqueta="¿Tiene microchip?" valor={v.microchip} alCambiar={(x) => cambiar("microchip", x)} error={errores.microchip} opciones={SI_NO} columnas={3} />
          <CampoArea
            id="caracter"
            etiqueta="Cuéntanos de tu mascota"
            opcional
            valor={v.caracter}
            alCambiar={(x) => cambiar("caracter", x)}
            error={errores.caracter}
            maxLength={800}
            filas={6}
            sugerencia={"Puedes contar, por ejemplo:\n· Cómo es: tranquilo, juguetón, si le gusta pasear o se asusta fácil.\n· Si convive bien con niños o con otros animales.\n· Salud: desparasitación, alguna enfermedad o tratamiento.\n· Qué hogar le vendría bien: con patio, compañía durante el día."}
          />
          <CampoSelect id="relacion" etiqueta="¿Cuál es tu relación con el animal?" valor={v.relacion} alCambiar={(x) => cambiar("relacion", x)} error={errores.relacion} opciones={opciones(RELACION_ANIMAL)} />
        </>
      )}

      {t.paso === 2 && (
        <>
          <p>No se publican. Las postulaciones te llegarán sin contactos; solo cuando elijas a una persona compartiremos los contactos de ambos.</p>
          <BloquePersona valores={v} errores={errores} cambiar={cambiar} sectores={sectores} etiquetaLocalidad="Localidad donde está el animal" />
          <CampoCasillas
            id="autoriza"
            etiqueta="Declaración"
            valores={v.autoriza === "SI" ? ["SI"] : []}
            alCambiar={(x) => cambiar("autoriza", x.includes("SI") ? "SI" : "")}
            error={errores.autoriza}
            opciones={[{ valor: "SI", texto: "Declaro que puedo dar en adopción a este animal (es mío o tengo autorización de quien es responsable de él) y acepto que el municipio publique su ficha y sus fotos." }]}
          />
        </>
      )}

      {t.paso === 3 && (
        <>
        <p className={estilos.nota}>
          <Icono nombre="info" tamano={20} />
          <span>Revisamos tu propuesta antes de publicarla en el catálogo de adopción. Las postulaciones te llegan y tú eliges.</span>
        </p>
        <Resumen
          filas={[
            ["Fotos", fotos.length ? `${fotos.length} ${fotos.length === 1 ? "foto nueva" : "fotos nuevas"}` : `Se mantienen las ${correccion?.fotos ?? 0} fotos anteriores`],
            ["Nombre o apodo", v.nombreAnimal || "Sin nombre"],
            ["Especie", ESPECIE[v.especie] ?? ""],
            ["Sexo", SEXO[v.sexo] ?? ""],
            ["Edad", v.edad ? edadEscrita(mesesDeEdad(v.edad)) : ""],
            ["Tamaño", v.tamano === "NO_SE" ? "No sé" : (TAMANO[v.tamano] ?? "")],
            ["Esterilizado", SI_NO_SE[v.esterilizado] ?? ""],
            ["Vacunas al día", SI_NO_SE[v.vacunas] ?? ""],
            ["Microchip", SI_NO_SE[v.microchip] ?? ""],
            ...(v.caracter ? [["Sobre el animal", v.caracter] as [string, string]] : []),
            ["Tu relación", RELACION_ANIMAL[v.relacion] ?? ""],
            ...filasPersona(v, sectores, "Dónde está el animal"),
          ]}
        />
        </>
      )}
    </MarcoPasos>
  );
}
