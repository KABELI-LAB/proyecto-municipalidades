"use client";
// Acciones sobre una propuesta propia de «Dar en adopción» en Mis solicitudes:
// corregirla si el municipio lo pidió, revisar las postulaciones y elegir (se
// comparten los contactos de ambos), avisar que encontró hogar o retirarla.
import { useState, useTransition } from "react";
import { Boton, EnlaceBoton } from "@/componentes/Boton";
import { EtiquetaEstado } from "@/componentes/EtiquetaEstado";
import { decidirPostulacion, gestionarPropuesta, postulacionesDePropuesta, type PostulacionRecibida } from "@/servidor/portal/acciones";
import estilos from "./mis-solicitudes.module.css";

type Props = { rut: string; codigo: string; corregir: boolean; cerrar: boolean; postulaciones: number; alTerminar: (mensaje: string) => void };
type Decision = "elegir" | "descartar" | "adoptado" | "no_concreto";

const PREGUNTA: Record<Decision, (n: string) => string> = {
  elegir: (n) => `Compartiremos su contacto con ${n} y usted verá el suyo, para que se conozcan. La ficha quedará en proceso de adopción. ¿Desea elegir a ${n}?`,
  descartar: (n) => `Avisaremos a ${n} que no fue seleccionada, con un mensaje respetuoso. ¿Desea continuar?`,
  adoptado: (n) => `Registraremos que ${n} adoptó al animal y la ficha saldrá del catálogo. ¿Se concretó la adopción?`,
  no_concreto: () => "La ficha volverá a estar disponible para recibir postulaciones. ¿La adopción no se concretó?",
};
const BOTON: Record<Decision, string> = { elegir: "Sí, elegir", descartar: "Sí, descartar", adoptado: "Sí, se concretó", no_concreto: "No se concretó" };

export function GestionPropuesta({ rut, codigo, corregir, cerrar, postulaciones, alTerminar }: Props) {
  const [confirmar, setConfirmar] = useState<"encontro_hogar" | "retirar" | null>(null);
  const [lista, setLista] = useState<PostulacionRecibida[] | null>(null);
  const [decision, setDecision] = useState<{ id: string; nombre: string; accion: Decision } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  const cargar = () =>
    iniciar(async () => {
      const r = await postulacionesDePropuesta({ rut, codigo });
      if (r.ok) setLista(r.postulaciones);
      else setError(r.mensaje);
    });

  const cerrarPropuesta = (accion: "encontro_hogar" | "retirar") =>
    iniciar(async () => {
      const r = await gestionarPropuesta({ rut, codigo, accion });
      if (r.ok) alTerminar(r.mensaje);
      else setError(r.mensaje);
    });

  const decidir = (d: { id: string; accion: Decision }) =>
    iniciar(async () => {
      const r = await decidirPostulacion({ rut, codigo, postulacionId: d.id, accion: d.accion });
      setDecision(null);
      if (!r.ok) return setError(r.mensaje);
      setError(null);
      const nueva = await postulacionesDePropuesta({ rut, codigo });
      if (nueva.ok) setLista(nueva.postulaciones);
      alTerminar(r.mensaje);
    });

  if (confirmar) {
    return (
      <div className={estilos.gestion} role="group" aria-label="Cerrar la propuesta">
        <p>{confirmar === "encontro_hogar" ? "La ficha dejará de mostrarse en el catálogo. ¿El animal ya encontró hogar?" : "La propuesta dejará de mostrarse y no recibirá postulaciones. ¿Desea retirarla?"}</p>
        {error && <p role="alert">{error}</p>}
        <div className={estilos.botones}>
          <Boton onClick={() => cerrarPropuesta(confirmar)} disabled={enviando}>
            {confirmar === "encontro_hogar" ? "Sí, encontró hogar" : "Sí, retirar"}
          </Boton>
          <Boton variante="secundario" onClick={() => setConfirmar(null)}>
            Volver
          </Boton>
        </div>
      </div>
    );
  }

  return (
    <div className={estilos.gestion}>
      {error && <p role="alert">{error}</p>}
      <div className={estilos.botones}>
        {/* El RUT nunca viaja en la dirección: se vuelve a pedir en la página de corrección. */}
        {corregir && <EnlaceBoton href={`/adoptar/dar?corregir=${codigo}`}>Corregir la propuesta</EnlaceBoton>}
        {postulaciones > 0 && lista === null && (
          <Boton onClick={cargar} disabled={enviando}>
            Ver postulaciones ({postulaciones})
          </Boton>
        )}
        {cerrar && (
          <>
            <Boton variante="secundario" onClick={() => setConfirmar("encontro_hogar")}>
              Ya encontró hogar
            </Boton>
            <Boton variante="secundario" onClick={() => setConfirmar("retirar")}>
              Retirar la propuesta
            </Boton>
          </>
        )}
      </div>

      {lista && (
        <section aria-label="Postulaciones recibidas" className={estilos.postulaciones}>
          <p className="nota">Le mostramos los datos de cada persona sin su contacto. Al elegir a una, compartiremos los contactos de ambos.</p>
          <ul>
            {lista.map((p) => (
              <li key={p.id} className={estilos.postulacion}>
                <div className={estilos.encabezado}>
                  <b>{p.nombre}</b>
                  <EtiquetaEstado estado={p.estado} />
                </div>
                <p>
                  {p.sector} · {p.vivienda} · {p.experiencia ? "ha tenido animales" : "primera vez"} · {p.otrosAnimales ? `otros animales: ${p.otrosAnimales}` : "sin otros animales"}
                </p>
                {p.contacto && (
                  <p>
                    <b>Contacto:</b> {p.contacto}
                  </p>
                )}
                <p className="nota">Postuló el {p.fecha}</p>
                {decision?.id === p.id ? (
                  <div role="group" aria-label="Confirmar decisión">
                    <p>{PREGUNTA[decision.accion](p.nombre)}</p>
                    <div className={estilos.botones}>
                      <Boton onClick={() => decidir(decision)} disabled={enviando}>
                        {BOTON[decision.accion]}
                      </Boton>
                      <Boton variante="secundario" onClick={() => setDecision(null)}>
                        Volver
                      </Boton>
                    </div>
                  </div>
                ) : (
                  <div className={estilos.botones}>
                    {p.pendiente && (
                      <>
                        <Boton onClick={() => setDecision({ id: p.id, nombre: p.nombre, accion: "elegir" })}>Elegir a esta persona</Boton>
                        <Boton variante="secundario" onClick={() => setDecision({ id: p.id, nombre: p.nombre, accion: "descartar" })}>
                          Descartar
                        </Boton>
                      </>
                    )}
                    {p.contacto && (
                      <>
                        <Boton onClick={() => setDecision({ id: p.id, nombre: p.nombre, accion: "adoptado" })}>Se concretó la adopción</Boton>
                        <Boton variante="secundario" onClick={() => setDecision({ id: p.id, nombre: p.nombre, accion: "no_concreto" })}>
                          No se concretó
                        </Boton>
                      </>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
