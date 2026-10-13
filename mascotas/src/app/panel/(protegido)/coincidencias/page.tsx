import type { Metadata } from "next";
import Link from "next/link";
import { EtiquetaEstado } from "@/componentes/EtiquetaEstado";
import { BotonAccion } from "@/componentes/panel/BotonAccion";
import { ResumenPublicacion } from "@/componentes/panel/ResumenPublicacion";
import { ESTADO_COINCIDENCIA } from "@/dominio/etiquetas";
import { numero } from "@/dominio/formato";
import { requerir } from "@/servidor/auth";
import { descartarCoincidencia, registrarReencuentro, validarCoincidencia } from "@/servidor/panel/acciones-bandejas";
import { coincidenciasBandeja, contarCoincidencias, type GrupoCoincidencias } from "@/servidor/panel/bandejas";
import estilos from "@/estilos/paginas.module.css";
import propios from "./coincidencias.module.css";

export const metadata: Metadata = { title: "Coincidencias · Panel municipal" };

// Responde: ¿estas dos publicaciones podrían ser del mismo animal?
export default async function CoincidenciasPanel({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  await requerir("moderarPublicaciones");
  const { ver } = await searchParams;
  const grupo: GrupoCoincidencias = ver === "VALIDADA" || ver === "cerradas" ? ver : "SUGERIDA";
  const [lista, cuenta] = await Promise.all([coincidenciasBandeja(grupo), contarCoincidencias()]);
  const pestanas: { clave: GrupoCoincidencias; texto: string }[] = [
    { clave: "SUGERIDA", texto: `Por validar (${cuenta.SUGERIDA})` },
    { clave: "VALIDADA", texto: `Validadas (${cuenta.VALIDADA})` },
    { clave: "cerradas", texto: "Cerradas" },
  ];

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <h1>Coincidencias</h1>
        <p>Posible coincidencia — función experimental: reglas por especie, lugar, fecha y rasgos.</p>
      </div>

      <nav aria-label="Estado de las coincidencias" className={estilos.pestanas}>
        {pestanas.map((p) => (
          <Link key={p.clave} href={`/panel/coincidencias?ver=${p.clave}`} aria-current={p.clave === grupo ? "page" : undefined} replace>
            {p.texto}
          </Link>
        ))}
      </nav>

      {lista.length === 0 ? (
        <div className={estilos.vacio}>
          <p>{grupo === "SUGERIDA" ? "No hay coincidencias por validar." : grupo === "VALIDADA" ? "No hay coincidencias validadas abiertas." : "No hay coincidencias cerradas."}</p>
        </div>
      ) : (
        lista.map((c) => {
          const cerrada = c.estado === "DESCARTADA" || c.perdida.estado !== "ABIERTA";
          return (
            <section key={c.id} className={estilos.panel} aria-label="Par de publicaciones">
              <div className={estilos.tituloSeccion}>
                <EtiquetaEstado estado={c.perdida.estado === "REENCONTRADA" ? { texto: "Reencuentro registrado", tono: "finalizado" } : ESTADO_COINCIDENCIA[c.estado]} />
                <span>Similitud {numero(c.puntaje * 100)} de 100</span>
              </div>
              <div className={propios.par}>
                <div className={propios.lado}>
                  <ResumenPublicacion p={c.perdida} conModeracion={false} Titulo="h3" />
                </div>
                <div className={propios.lado}>
                  <ResumenPublicacion p={c.encontrada} conModeracion={false} Titulo="h3" />
                </div>
              </div>
              <div>
                <b>Por qué se sugiere:</b>
                <ul>
                  {c.motivos.split(";").map((m) => (
                    <li key={m}>{m.trim()}</li>
                  ))}
                </ul>
              </div>
              {!cerrada && (
                <div className={estilos.accionesCabecera}>
                  {c.estado === "SUGERIDA" && <BotonAccion accion={validarCoincidencia.bind(null, c.id)} texto="Validar y avisar a ambas personas" variante="primario" />}
                  <BotonAccion
                    accion={registrarReencuentro.bind(null, c.id)}
                    texto="Registrar reencuentro"
                    variante={c.estado === "VALIDADA" ? "primario" : "secundario"}
                    confirmar="Ambas publicaciones quedarán como reencontradas y dejarán de mostrarse. ¿Confirma que el animal volvió con su familia?"
                    textoConfirmar="Sí, registrar"
                  />
                  <BotonAccion accion={descartarCoincidencia.bind(null, c.id)} texto="Descartar" confirmar="Esta coincidencia dejará de sugerirse. ¿Desea descartarla?" textoConfirmar="Sí, descartar" />
                </div>
              )}
            </section>
          );
        })
      )}
      <p className="nota">Nunca afirmamos que se trate del mismo animal: validar solo invita a las personas a revisar y conversar por la plataforma.</p>
    </div>
  );
}
