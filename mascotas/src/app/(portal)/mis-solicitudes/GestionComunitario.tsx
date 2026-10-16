"use client";
// Gestión de un perro comunitario por su cuidador, desde Mis solicitudes: anotar
// que lo vio hoy, actualizar la ficha (con foto nueva opcional), leer las
// novedades de los vecinos y darlo de baja si ya no está.
import { useState, useTransition } from "react";
import { Boton } from "@/componentes/Boton";
import { CampoFoto, CampoOpciones, CampoSelect, CampoTexto, type Opcion } from "@/componentes/formulario/Campos";
import { SEXO, SI_NO_SE, TAMANO } from "@/dominio/etiquetas";
import {
  actualizarFichaComunitario,
  darDeBajaComunitario,
  fichaParaEditar,
  marcarNovedadVista,
  registrarVistoHoy,
  type FichaParaEditar,
} from "@/servidor/portal/acciones-comunitarios";
import formulario from "@/componentes/formulario/formulario.module.css";
import estilos from "./mis-solicitudes.module.css";

type Props = {
  rut: string;
  codigo: string;
  perro: { id: string; apodo: string; novedades: { codigo: string; tipo: string; texto: string; fecha: string }[] };
  alTerminar: (mensaje: string) => void;
};

const opciones = (m: Record<string, string>): Opcion[] => Object.entries(m).map(([valor, texto]) => ({ valor, texto }));
const SI_NO = opciones(SI_NO_SE);

export function GestionComunitario({ rut, codigo, perro, alTerminar }: Props) {
  const [modo, setModo] = useState<"inicio" | "editar" | "baja">("inicio");
  const [ficha, setFicha] = useState<FichaParaEditar | null>(null);
  const [foto, setFoto] = useState<Blob | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  const ejecutar = (accion: () => Promise<{ ok: boolean; mensaje: string; errores?: Record<string, string> }>) =>
    iniciar(async () => {
      setError(null);
      const r = await accion();
      if (r.ok) alTerminar(r.mensaje);
      else {
        setError(r.mensaje);
        setErrores(r.errores ?? {});
      }
    });

  const abrirEdicion = () =>
    iniciar(async () => {
      const r = await fichaParaEditar({ rut, codigo });
      if (!r.ok) return setError(r.mensaje);
      setFicha({ valores: r.valores, lugares: r.lugares });
      setModo("editar");
    });

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ficha) return;
    const datos = new FormData();
    datos.set("rut", rut);
    datos.set("codigo", codigo);
    datos.set("datos", JSON.stringify(ficha.valores));
    if (foto) datos.set("foto", foto, "foto.jpg");
    ejecutar(() => actualizarFichaComunitario(datos));
  };

  if (modo === "editar" && ficha) {
    const v = ficha.valores;
    const cambiar = (k: string, x: string) => setFicha({ ...ficha, valores: { ...v, [k]: x } });
    return (
      <form className={estilos.gestion} onSubmit={guardar} noValidate aria-label={`Actualizar la ficha de ${perro.apodo}`}>
        <CampoFoto id={`foto-${codigo}`} etiqueta="Foto nueva" opcional archivo={foto} alCambiar={setFoto} error={errores.foto} ayuda="Si agregas una, reemplaza a la actual." />
        <CampoTexto id={`apodo-${codigo}`} etiqueta="Apodo" valor={v.apodo} alCambiar={(x) => cambiar("apodo", x)} error={errores.apodo} maxLength={60} />
        <CampoSelect id={`lugar-${codigo}`} etiqueta="¿Dónde suele estar?" valor={v.lugarId} alCambiar={(x) => cambiar("lugarId", x)} error={errores.lugarId} opciones={ficha.lugares} />
        <div className={formulario.fila}>
          <CampoSelect id={`sexo-${codigo}`} etiqueta="Sexo" valor={v.sexo} alCambiar={(x) => cambiar("sexo", x)} error={errores.sexo} opciones={opciones(SEXO)} />
          <CampoSelect id={`tamano-${codigo}`} etiqueta="Tamaño" valor={v.tamano} alCambiar={(x) => cambiar("tamano", x)} error={errores.tamano} opciones={[...opciones(TAMANO), { valor: "NO_SE", texto: "No se sabe" }]} />
          <CampoTexto id={`color-${codigo}`} etiqueta="Color" opcional valor={v.colorPrincipal} alCambiar={(x) => cambiar("colorPrincipal", x)} error={errores.colorPrincipal} maxLength={40} />
        </div>
        <CampoTexto id={`rasgos-${codigo}`} etiqueta="Señas para reconocerlo" opcional valor={v.rasgos} alCambiar={(x) => cambiar("rasgos", x)} error={errores.rasgos} maxLength={160} />
        <CampoOpciones id={`esterilizado-${codigo}`} etiqueta="¿Está esterilizado?" valor={v.esterilizado} alCambiar={(x) => cambiar("esterilizado", x)} error={errores.esterilizado} opciones={SI_NO} columnas={3} />
        <CampoOpciones id={`vacunas-${codigo}`} etiqueta="¿Tiene sus vacunas al día?" valor={v.vacunas} alCambiar={(x) => cambiar("vacunas", x)} error={errores.vacunas} opciones={SI_NO} columnas={3} />
        <CampoOpciones id={`microchip-${codigo}`} etiqueta="¿Tiene microchip?" valor={v.microchip} alCambiar={(x) => cambiar("microchip", x)} error={errores.microchip} opciones={SI_NO} columnas={3} />
        {error && <p role="alert">{error}</p>}
        <div className={estilos.botones}>
          <Boton type="submit" disabled={enviando}>
            {enviando ? "Guardando…" : "Guardar cambios"}
          </Boton>
          <Boton variante="secundario" onClick={() => setModo("inicio")} disabled={enviando}>
            Volver
          </Boton>
        </div>
      </form>
    );
  }

  if (modo === "baja") {
    return (
      <div className={estilos.gestion} role="group" aria-label="Dar de baja la ficha">
        <p>{perro.apodo} dejará de mostrarse en el portal y en el mapa. Úsalo si ya no está en su lugar. ¿Quieres continuar?</p>
        {error && <p role="alert">{error}</p>}
        <div className={estilos.botones}>
          <Boton onClick={() => ejecutar(() => darDeBajaComunitario({ rut, codigo }))} disabled={enviando}>
            {enviando ? "Un momento…" : "Sí, ya no está"}
          </Boton>
          <Boton variante="secundario" onClick={() => setModo("inicio")} disabled={enviando}>
            Volver
          </Boton>
        </div>
      </div>
    );
  }

  return (
    <div className={estilos.gestion}>
      {perro.novedades.length > 0 && (
        <ul className={estilos.postulaciones} aria-label="Novedades de vecinos">
          {perro.novedades.map((n) => (
            <li key={n.codigo} className={estilos.postulacion}>
              <b>{n.tipo}</b> · {n.fecha}
              <p>{n.texto}</p>
              <div className={estilos.botones}>
                <Boton variante="secundario" onClick={() => ejecutar(() => marcarNovedadVista({ rut, codigo, novedad: n.codigo }))} disabled={enviando}>
                  Marcar como vista
                </Boton>
              </div>
            </li>
          ))}
        </ul>
      )}
      {error && <p role="alert">{error}</p>}
      <div className={estilos.botones}>
        <Boton onClick={() => ejecutar(() => registrarVistoHoy({ rut, codigo }))} disabled={enviando}>
          Lo vi hoy
        </Boton>
        <Boton variante="secundario" onClick={abrirEdicion} disabled={enviando}>
          Actualizar ficha
        </Boton>
        <Boton variante="secundario" onClick={() => setModo("baja")} disabled={enviando}>
          Ya no está
        </Boton>
      </div>
    </div>
  );
}
