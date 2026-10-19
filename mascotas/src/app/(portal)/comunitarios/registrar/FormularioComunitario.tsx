"use client";
// Registrar un perro comunitario: lo hace cualquier vecino, se publica de
// inmediato y quien lo registra queda como su cuidador (con un código para
// gestionarlo en Mis solicitudes). La foto viaja aparte de los campos.
import { useState } from "react";
import { CampoFoto, CampoOpciones, CampoSelect, CampoTexto, type Opcion } from "@/componentes/formulario/Campos";
import { MarcoPasos, Resumen } from "@/componentes/formulario/MarcoPasos";
import { ResultadoTramite } from "@/componentes/formulario/ResultadoTramite";
import { useTramite } from "@/componentes/formulario/useTramite";
import { Icono } from "@/componentes/Icono";
import { SEXO, SI_NO_SE, TAMANO } from "@/dominio/etiquetas";
import { esquemaRegistroComunitario } from "@/lib/esquemas";
import { registrarComunitario } from "@/servidor/portal/acciones-comunitarios";
import estilos from "@/componentes/formulario/formulario.module.css";

const TITULOS = ["El perro", "Dónde está y salud", "Tus datos", "Revisa y publica"] as const;
const PASOS = [
  ["foto", "apodo", "sexo", "tamano", "colorPrincipal", "rasgos"],
  ["lugarId", "esterilizado", "vacunas", "microchip"],
  ["nombre", "rut", "telefono", "correo"],
  [],
] as const;

const VACIO = {
  apodo: "",
  lugarId: "",
  sexo: "",
  tamano: "",
  colorPrincipal: "",
  rasgos: "",
  esterilizado: "",
  vacunas: "",
  microchip: "",
  nombre: "",
  rut: "",
  telefono: "",
  correo: "",
};

const opciones = (m: Record<string, string>): Opcion[] => Object.entries(m).map(([valor, texto]) => ({ valor, texto }));
const SI_NO = opciones(SI_NO_SE);

export function FormularioComunitario({ lugares }: { lugares: Opcion[] }) {
  const t = useTramite(esquemaRegistroComunitario, VACIO, PASOS);
  const [foto, setFoto] = useState<Blob | null>(null);
  const [errorFoto, setErrorFoto] = useState<string | undefined>();
  const [hecho, setHecho] = useState<{ codigo: string; id: string } | null>(null);
  const { valores: v, errores, cambiar } = t;

  if (hecho) {
    return (
      <ResultadoTramite titulo={`Publicamos a ${v.apodo}`}>
        <p>
          Ya está en el portal. Como su cuidador, en Mis solicitudes (entrando con tu correo) puedes actualizar la ficha, anotar que lo
          viste y leer las novedades que te envíen los vecinos.
        </p>
      </ResultadoTramite>
    );
  }

  function avanzar() {
    // La foto no está en el esquema de texto: se revisa aquí antes de dejar el primer paso.
    if (t.paso === 0 && !foto) {
      setErrorFoto("Agrega una foto: en el portal solo se muestran perros con foto.");
      return document.getElementById("foto")?.focus();
    }
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
            if (foto) datos.set("foto", foto, "foto.jpg");
            return registrarComunitario(datos);
          },
          (r) => setHecho({ codigo: r.codigo ?? "", id: r.id ?? "" }),
        )
      }
      textoConfirmar="Publicar"
    >
      {t.paso === 0 && (
        <>
          <CampoFoto
            id="foto"
            etiqueta="Foto del perro"
            archivo={foto}
            alCambiar={(f) => {
              setFoto(f);
              if (f) setErrorFoto(undefined);
            }}
            error={errorFoto}
            ayuda="Que se vea bien el perro. Evita que aparezcan personas, patentes o el frente de una casa."
          />
          <CampoTexto id="apodo" etiqueta="¿Cómo lo conocen en el barrio?" valor={v.apodo} alCambiar={(x) => cambiar("apodo", x)} error={errores.apodo} maxLength={60} />
          <div className={estilos.fila}>
            <CampoSelect id="sexo" etiqueta="Sexo" valor={v.sexo} alCambiar={(x) => cambiar("sexo", x)} error={errores.sexo} opciones={opciones(SEXO)} />
            <CampoSelect id="tamano" etiqueta="Tamaño" valor={v.tamano} alCambiar={(x) => cambiar("tamano", x)} error={errores.tamano} opciones={[...opciones(TAMANO), { valor: "NO_SE", texto: "No se sabe" }]} />
            <CampoTexto id="colorPrincipal" etiqueta="Color" opcional valor={v.colorPrincipal} alCambiar={(x) => cambiar("colorPrincipal", x)} error={errores.colorPrincipal} maxLength={40} />
          </div>
          <CampoTexto id="rasgos" etiqueta="Señas para reconocerlo" opcional valor={v.rasgos} alCambiar={(x) => cambiar("rasgos", x)} error={errores.rasgos} maxLength={160} ayuda="Por ejemplo, una oreja caída o una mancha blanca en el pecho." />
        </>
      )}

      {t.paso === 1 && (
        <>
          <CampoSelect id="lugarId" etiqueta="¿Dónde suele estar?" valor={v.lugarId} alCambiar={(x) => cambiar("lugarId", x)} error={errores.lugarId} opciones={lugares} ayuda="Un lugar público de referencia. Nunca indicamos domicilios." />
          <CampoOpciones id="esterilizado" etiqueta="¿Está esterilizado?" valor={v.esterilizado} alCambiar={(x) => cambiar("esterilizado", x)} error={errores.esterilizado} opciones={SI_NO} columnas={3} />
          <CampoOpciones id="vacunas" etiqueta="¿Tiene sus vacunas al día?" valor={v.vacunas} alCambiar={(x) => cambiar("vacunas", x)} error={errores.vacunas} opciones={SI_NO} columnas={3} />
          <CampoOpciones id="microchip" etiqueta="¿Tiene microchip?" valor={v.microchip} alCambiar={(x) => cambiar("microchip", x)} error={errores.microchip} opciones={SI_NO} columnas={3} />
        </>
      )}

      {t.paso === 2 && (
        <>
          <p>No se publican. Quedarás como cuidador del perro y podrás actualizar su ficha desde Mis solicitudes.</p>
          <CampoTexto id="nombre" etiqueta="Nombre y apellido" valor={v.nombre} alCambiar={(x) => cambiar("nombre", x)} error={errores.nombre} autoComplete="name" maxLength={100} />
          <CampoTexto id="rut" etiqueta="RUT" valor={v.rut} alCambiar={(x) => cambiar("rut", x)} error={errores.rut} ayuda="Por ejemplo, 12.345.678-5." maxLength={12} />
          <div className={estilos.fila}>
            <CampoTexto id="telefono" etiqueta="Teléfono (opcional)" tipo="tel" inputMode="tel" autoComplete="tel" valor={v.telefono} alCambiar={(x) => cambiar("telefono", x)} error={errores.telefono} maxLength={20} />
            <CampoTexto id="correo" etiqueta="Correo" tipo="email" inputMode="email" autoComplete="email" valor={v.correo} alCambiar={(x) => cambiar("correo", x)} error={errores.correo} maxLength={120} />
          </div>
          <p className={estilos.ayuda}>Por correo te llegarán las novedades de los vecinos, y con él entras a Mis solicitudes.</p>
        </>
      )}

      {t.paso === 3 && (
        <>
          <p className={estilos.nota}>
            <Icono nombre="info" tamano={20} />
            <span>Se publica de inmediato en el portal y en el mapa. Quedas como su cuidador; tus datos no se publican.</span>
          </p>
          <Resumen
            filas={[
              ["Apodo", v.apodo],
              ["Sexo", SEXO[v.sexo] ?? ""],
              ["Tamaño", v.tamano === "NO_SE" ? "No se sabe" : (TAMANO[v.tamano] ?? "")],
              ...(v.colorPrincipal ? [["Color", v.colorPrincipal] as [string, string]] : []),
              ...(v.rasgos ? [["Señas", v.rasgos] as [string, string]] : []),
              ["Dónde suele estar", lugares.find((l) => l.valor === v.lugarId)?.texto ?? ""],
              ["Esterilizado", SI_NO_SE[v.esterilizado] ?? ""],
              ["Vacunas al día", SI_NO_SE[v.vacunas] ?? ""],
              ["Microchip", SI_NO_SE[v.microchip] ?? ""],
              ["Cuidador", v.nombre],
              ["Contacto", [v.telefono, v.correo].filter(Boolean).join(" · ")],
            ]}
          />
        </>
      )}
    </MarcoPasos>
  );
}
