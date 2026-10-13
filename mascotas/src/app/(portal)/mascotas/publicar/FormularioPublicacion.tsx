"use client";
import Link from "next/link";
import { useState } from "react";
import { BloquePersona, CampoLocalidad, filasPersona, OPCIONES_ESPECIE, PERSONA_VACIA, type SectorOpcion } from "@/componentes/formulario/Bloques";
import { CampoArea, CampoFoto, CampoOpciones, CampoSelect, CampoTexto } from "@/componentes/formulario/Campos";
import { MarcoPasos, Resumen } from "@/componentes/formulario/MarcoPasos";
import { ResultadoTramite } from "@/componentes/formulario/ResultadoTramite";
import { Icono } from "@/componentes/Icono";
import { useTramite } from "@/componentes/formulario/useTramite";
import { ESPECIE, SEXO, SI_NO_SE, TAMANO } from "@/dominio/etiquetas";
import { esquemaPublicacion } from "@/lib/esquemas";
import { publicarMascota, type ResultadoPublicacion } from "@/servidor/portal/acciones";
import estilos from "@/componentes/formulario/formulario.module.css";

/**
 * `tipoInicial`: «Reportar mascota perdida» (PERDIDA) o «Informar mascota
 * avistada» (ENCONTRADA). `vinculo`: aviso de pérdida al que se vincula un
 * avistamiento, con su descripción para mostrarla.
 */
type Props = {
  sectores: SectorOpcion[];
  colores: Record<"PERRO" | "GATO", string[]>;
  hoy: string;
  minimo: string;
  tipoInicial?: "PERDIDA" | "ENCONTRADA" | "";
  vinculo?: { id: string; especie: string; descripcion: string };
};

const TITULOS = ["Qué, cuándo y dónde", "Cómo es el animal y sus datos", "Revise y publique"] as const;
const PASOS = [
  ["tipo", "especie", "fechaEvento", "localidadId"],
  ["colorPrincipal", "tamano", "sexo", "nombreAnimal", "collar", "colorCollar", "microchip", "senas", "resguardada", "resguardoLocalidadId", "resguardoDetalle", "foto", "nombre", "rut", "telefono", "correo"],
  [],
] as const;

/** Resumen de dónde está el animal avistado, con la localidad elegida y su sector. */
function resumenResguardo(v: Record<string, string | string[]>, sectores: SectorOpcion[]) {
  if (v.resguardada === "no") return "No lo retuvo, solo lo vio";
  const s = sectores.find((x) => x.localidades.some((l) => l.id === v.resguardoLocalidadId));
  const l = s?.localidades.find((x) => x.id === v.resguardoLocalidadId);
  const donde = l && s ? `, en ${l.nombre} (sector ${s.nombre})` : "";
  const detalle = v.resguardoDetalle ? `: ${v.resguardoDetalle}` : "";
  return `${v.resguardada === "lugar" ? "Retenido en otro lugar" : "Está con usted"}${donde}${detalle}`;
}

const opciones = (m: Record<string, string>) => Object.entries(m).map(([valor, texto]) => ({ valor, texto }));
const OPCIONES_SI_NO_SE = opciones(SI_NO_SE);

/** «2026-10-06» → «6 de octubre de 2026». */
const fechaLegible = (dia: string) =>
  dia ? new Date(`${dia}T12:00:00`).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" }) : "";

export function FormularioPublicacion({ sectores, colores, hoy, minimo, tipoInicial = "", vinculo }: Props) {
  const t = useTramite(
    esquemaPublicacion,
    {
      tipo: vinculo ? "ENCONTRADA" : tipoInicial,
      vinculo: vinculo?.id ?? "",
      especie: vinculo?.especie ?? "",
      fechaEvento: hoy,
      colorPrincipal: "",
      tamano: "",
      sexo: "",
      nombreAnimal: "",
      collar: "",
      colorCollar: "",
      microchip: "",
      senas: "",
      resguardada: "",
      resguardoLocalidadId: "",
      resguardoDetalle: "",
      ...PERSONA_VACIA,
    },
    PASOS,
  );
  const [hecho, setHecho] = useState<Extract<ResultadoPublicacion, { ok: true }> | null>(null);
  const [foto, setFoto] = useState<Blob | null>(null);
  const { valores: v, errores, cambiar } = t;
  const perdida = v.tipo === "PERDIDA";
  const encontrada = v.tipo === "ENCONTRADA";
  const catalogo = v.especie === "PERRO" || v.especie === "GATO" ? colores[v.especie] : null;

  if (hecho) {
    const n = hecho.coincidencias.length;
    return (
      <ResultadoTramite titulo="Recibimos su aviso" codigo={hecho.codigo} conRut={!encontrada}>
        {hecho.conFoto ? (
          <p>
            El equipo municipal lo revisará y, al aceptarlo, lo publicaremos en el portal y en las redes sociales del
            municipio. Le avisaremos cuando esté publicado. Las personas que quieran contactarle le escribirán a través de
            la plataforma, sin ver su teléfono ni su correo.
          </p>
        ) : (
          <p>
            En el portal solo mostramos avisos con foto, y el suyo no tiene. Igual buscamos posibles coincidencias y le
            avisaremos si aparece una.{!encontrada && " Puede revisar su aviso en Mis solicitudes."}
          </p>
        )}
        {encontrada && vinculo && <p>Quedó vinculado al aviso de pérdida como posible coincidencia y avisamos a quien la busca. No podemos asegurar que sea el mismo animal.</p>}
        {encontrada && (v.resguardada === "si" || v.resguardada === "lugar") && (
          <p>
            Si puede, lleve al animal a una veterinaria o al municipio para revisar si tiene microchip: es la forma más
            rápida de ubicar a su familia.
          </p>
        )}
        {n > 0 ? (
          <div className={estilos.cuerpo}>
            <h3>Posible coincidencia — función experimental</h3>
            <p>
              {n === 1 ? "Hay una publicación que podría corresponder" : `Hay ${n} publicaciones que podrían corresponder`}{" "}
              {encontrada ? "al animal que vio" : "a su mascota"}. {n === 1 ? "Revísela" : "Revíselas"}; no podemos
              asegurar que se trate del mismo animal.
            </p>
            <ul>
              {hecho.coincidencias.map((c) => (
                <li key={c.id}>
                  <Link href={`/mascotas/${c.id}`}>
                    {c.tipo}: {c.especie} {c.color}, {c.sector}, {c.fecha}
                  </Link>
                  . Por qué: {c.motivos.join(", ").toLowerCase()}.
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>Por ahora no encontramos publicaciones parecidas. Si aparece una, le avisaremos.</p>
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
      alConfirmar={() =>
        t.enviar((valores) => {
          const datos = new FormData();
          datos.set("datos", JSON.stringify(valores));
          if (foto) datos.set("foto", foto, "foto.jpg");
          return publicarMascota(datos);
        }, (r) => setHecho(r))
      }
      textoConfirmar="Publicar aviso"
    >
      {t.paso === 0 && (
        <>
          {vinculo && (
            <p className={estilos.aviso} role="note">
              Su avistamiento quedará vinculado al aviso «{vinculo.descripcion}» como posible coincidencia. No necesita estar seguro de que sea el mismo animal.
            </p>
          )}
          <CampoOpciones
            id="tipo"
            etiqueta="¿Qué quiere informar?"
            valor={v.tipo}
            alCambiar={(x) => {
              cambiar("tipo", x);
              // Al avisar un avistamiento no pedimos RUT.
              if (x === "ENCONTRADA") cambiar("rut", "");
            }}
            error={errores.tipo}
            opciones={[
              { valor: "PERDIDA", texto: "Se me perdió una mascota", descripcion: "Publique cómo es su animal para que puedan reconocerlo." },
              { valor: "ENCONTRADA", texto: "Vi una mascota que podría estar perdida", descripcion: "Informe dónde y cuándo la vio; si la tiene resguardada, también puede indicarlo." },
            ]}
          />
          <CampoOpciones id="especie" etiqueta="Especie" valor={v.especie} alCambiar={(x) => { cambiar("especie", x); cambiar("colorPrincipal", ""); }} error={errores.especie} opciones={OPCIONES_ESPECIE} columnas={3} />
          <div className={estilos.fila}>
            <CampoTexto
              id="fechaEvento"
              tipo="date"
              etiqueta={encontrada ? "Fecha en que la vio" : "Fecha en que se perdió"}
              valor={v.fechaEvento}
              alCambiar={(x) => cambiar("fechaEvento", x)}
              error={errores.fechaEvento}
              min={minimo}
              max={hoy}
            />
            <CampoLocalidad
              etiqueta={encontrada ? "Localidad donde la vio" : "Localidad donde se perdió"}
              valor={v.localidadId}
              alCambiar={(x) => cambiar("localidadId", x)}
              error={errores.localidadId}
              sectores={sectores}
              ayuda="El aviso muestra el sector y la localidad, nunca una dirección."
            />
          </div>
        </>
      )}

      {t.paso === 1 && (
        <>
          <div className={estilos.fila}>
            {catalogo ? (
              <CampoSelect id="colorPrincipal" etiqueta="Color principal" valor={v.colorPrincipal} alCambiar={(x) => cambiar("colorPrincipal", x)} error={errores.colorPrincipal} opciones={catalogo.map((c) => ({ valor: c, texto: c.charAt(0).toUpperCase() + c.slice(1) }))} />
            ) : (
              <CampoTexto id="colorPrincipal" etiqueta="Color principal" valor={v.colorPrincipal} alCambiar={(x) => cambiar("colorPrincipal", x)} error={errores.colorPrincipal} maxLength={40} />
            )}
            <CampoSelect id="tamano" etiqueta="Tamaño" valor={v.tamano} alCambiar={(x) => cambiar("tamano", x)} error={errores.tamano} opciones={opciones(TAMANO)} />
            <CampoSelect id="sexo" etiqueta="Sexo" valor={v.sexo} alCambiar={(x) => cambiar("sexo", x)} error={errores.sexo} opciones={opciones(SEXO)} />
          </div>
          {perdida && (
            <CampoTexto id="nombreAnimal" etiqueta="Nombre al que responde" opcional valor={v.nombreAnimal} alCambiar={(x) => cambiar("nombreAnimal", x)} error={errores.nombreAnimal} maxLength={40} />
          )}
          <CampoOpciones
            id="collar"
            etiqueta={perdida ? "¿Llevaba collar?" : "¿Lleva collar?"}
            valor={v.collar}
            alCambiar={(x) => cambiar("collar", x)}
            error={errores.collar}
            opciones={OPCIONES_SI_NO_SE}
            columnas={3}
          />
          {v.collar === "SI" && (
            <CampoTexto id="colorCollar" etiqueta="Cómo es el collar" opcional valor={v.colorCollar} alCambiar={(x) => cambiar("colorCollar", x)} error={errores.colorCollar} ayuda="Por ejemplo, «rojo con placa»." maxLength={40} />
          )}
          {perdida && (
            <CampoOpciones id="microchip" etiqueta="¿Tiene microchip?" valor={v.microchip} alCambiar={(x) => cambiar("microchip", x)} error={errores.microchip} opciones={OPCIONES_SI_NO_SE} columnas={3} />
          )}
          <CampoArea
            id="senas"
            etiqueta="Señas particulares"
            opcional
            valor={v.senas}
            alCambiar={(x) => cambiar("senas", x)}
            error={errores.senas}
            maxLength={300}
            ayuda={encontrada ? "Qué vio: cómo se veía, hacia dónde iba o cualquier detalle que ayude a reconocerlo. Sin direcciones exactas." : "Manchas, cicatrices, forma de las orejas o de la cola, o cualquier detalle que ayude a reconocerlo."}
          />
          {encontrada && (
            <CampoOpciones
              id="resguardada"
              etiqueta="¿Dónde está el animal ahora?"
              valor={v.resguardada}
              alCambiar={(x) => {
                cambiar("resguardada", x);
                // Por defecto, la misma localidad donde la vio.
                if (x !== "no" && !v.resguardoLocalidadId && v.localidadId) cambiar("resguardoLocalidadId", v.localidadId);
              }}
              error={errores.resguardada}
              opciones={[
                { valor: "si", texto: "Está conmigo", descripcion: "Lo tengo resguardado." },
                { valor: "lugar", texto: "Está retenido en otro lugar", descripcion: "Por ejemplo, en una veterinaria, un local o con un vecino." },
                { valor: "no", texto: "No lo retuve, solo lo vi" },
              ]}
            />
          )}
          {encontrada && (v.resguardada === "si" || v.resguardada === "lugar") && (
            <>
              <CampoLocalidad
                id="resguardoLocalidadId"
                etiqueta="Localidad donde está resguardado"
                valor={v.resguardoLocalidadId}
                alCambiar={(x) => cambiar("resguardoLocalidadId", x)}
                error={errores.resguardoLocalidadId}
                sectores={sectores}
                ayuda="El aviso muestra la localidad y su sector, nunca una dirección."
              />
              <CampoTexto
                id="resguardoDetalle"
                etiqueta={v.resguardada === "lugar" ? "¿Qué lugar es?" : "Información del resguardo"}
                opcional={v.resguardada !== "lugar"}
                valor={v.resguardoDetalle}
                alCambiar={(x) => cambiar("resguardoDetalle", x)}
                error={errores.resguardoDetalle}
                maxLength={120}
                ayuda={
                  v.resguardada === "lugar"
                    ? "Por ejemplo, «en una veterinaria del centro» o «con una vecina, cerca de la plaza». Sin dirección exacta ni teléfonos."
                    : "Por ejemplo, «está tranquilo y comiendo bien». Sin dirección exacta ni teléfonos."
                }
              />
            </>
          )}
          <CampoFoto
            id="foto"
            etiqueta="Foto del animal"
            opcional
            archivo={foto}
            alCambiar={setFoto}
            error={errores.foto}
            ayuda="El portal muestra solo avisos con foto. Evite que aparezcan personas, patentes o el frente de una casa."
          />

          <h3 className={estilos.subtitulo}>Sus datos</h3>
          <p>No se publican. Los usamos para avisarle si alguien le escribe o si hay una posible coincidencia.</p>
          <BloquePersona valores={v} errores={errores} cambiar={cambiar} sectores={sectores} sinLocalidad rut={encontrada ? "no" : "obligatorio"} />
        </>
      )}

      {t.paso === 2 && (
        <>
        <p className={estilos.nota}>
          <Icono nombre="info" tamano={20} />
          <span>
            {foto
              ? "Cuando el equipo municipal lo acepte, publicaremos su aviso aquí en el portal y en las redes sociales del municipio. Solo mostramos los datos del animal, el sector y la fecha."
              : "Sin foto, su aviso no se publica en el portal ni en las redes sociales, pero igual buscamos posibles coincidencias."}
          </span>
        </p>
        <Resumen
          filas={[
            ["Aviso", perdida ? "Mascota perdida" : "Mascota avistada"],
            ["Foto", foto ? "Adjunta" : "Sin foto (no se mostrará en el portal)"],
            ["Especie", ESPECIE[v.especie] ?? ""],
            ["Fecha", fechaLegible(v.fechaEvento)],
            ["Color principal", v.colorPrincipal],
            ["Tamaño", TAMANO[v.tamano] ?? ""],
            ["Sexo", SEXO[v.sexo] ?? ""],
            ...(perdida ? [["Nombre al que responde", v.nombreAnimal] as [string, string]] : []),
            ["Collar", v.collar === "SI" && v.colorCollar ? `Sí, ${v.colorCollar}` : SI_NO_SE[v.collar] ?? ""],
            ...(perdida ? [["Microchip", SI_NO_SE[v.microchip] ?? ""] as [string, string]] : []),
            ["Señas particulares", v.senas],
            ...(encontrada ? [["Dónde está ahora", resumenResguardo(v, sectores)] as [string, string]] : []),
            ...filasPersona(v, sectores, encontrada ? "Dónde la vio" : "Dónde se perdió"),
          ]}
        />
        </>
      )}
    </MarcoPasos>
  );
}
