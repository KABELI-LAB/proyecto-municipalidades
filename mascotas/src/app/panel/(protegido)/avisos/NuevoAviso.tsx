"use client";
// Nuevo aviso a los vecinos: tipo, título, texto y hasta cuándo. Se publica de
// una vez para toda la comuna. Plegado hasta que se pide.
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Boton } from "@/componentes/Boton";
import { CampoArea, CampoSelect, CampoTexto } from "@/componentes/formulario/Campos";
import { Icono } from "@/componentes/Icono";
import { useMensaje } from "@/componentes/panel/Mensajes";
import { crearAviso } from "@/servidor/panel/acciones-avisos";
import formulario from "@/componentes/formulario/formulario.module.css";

const TIPOS = [
  { valor: "INFORMACION", texto: "Información" },
  { valor: "CAMPANA", texto: "Campaña" },
  { valor: "ALERTA", texto: "Alerta" },
  { valor: "CAMBIO", texto: "Cambio o cancelación" },
];

export function NuevoAviso({ hastaSugerido }: { hastaSugerido: string }) {
  const vacio = { tipo: "INFORMACION", titulo: "", texto: "", hasta: hastaSugerido };
  const [abierto, setAbierto] = useState(false);
  const [v, setV] = useState(vacio);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, iniciar] = useTransition();
  const mostrar = useMensaje();
  const router = useRouter();
  const cambiar = (k: keyof typeof v) => (x: string) => setV((a) => ({ ...a, [k]: x }));

  if (!abierto) {
    return (
      <div>
        <Boton onClick={() => setAbierto(true)}>
          <Icono nombre="megafono" tamano={20} />
          Nuevo aviso
        </Boton>
      </div>
    );
  }

  const publicar = (e: React.FormEvent) => {
    e.preventDefault();
    iniciar(async () => {
      const r = await crearAviso(v);
      setErrores(r.errores ?? {});
      mostrar({ ok: r.ok, texto: r.mensaje });
      if (r.ok) {
        setV(vacio);
        setAbierto(false);
        router.refresh();
      }
    });
  };

  return (
    <form className={`${formulario.formulario} ${formulario.formularioCorto}`} onSubmit={publicar} noValidate aria-label="Nuevo aviso">
      <div className={formulario.fila}>
        <CampoSelect id="tipo" etiqueta="Tipo" valor={v.tipo} alCambiar={cambiar("tipo")} error={errores.tipo} opciones={TIPOS} />
        <CampoTexto id="hasta" tipo="date" etiqueta="Visible hasta" valor={v.hasta} alCambiar={cambiar("hasta")} error={errores.hasta} />
      </div>
      <CampoTexto id="titulo" etiqueta="Título" valor={v.titulo} alCambiar={cambiar("titulo")} error={errores.titulo} maxLength={90} />
      <CampoArea id="texto" etiqueta="Texto" valor={v.texto} alCambiar={cambiar("texto")} error={errores.texto} maxLength={400} filas={3} sugerencia="Tutea a vecinas y vecinos. Usa corchetes para lo que falta confirmar, por ejemplo [fecha]." />
      <div className={formulario.navegacion}>
        <Boton type="submit" disabled={enviando}>
          {enviando ? "Publicando…" : "Publicar aviso"}
        </Boton>
        <Boton variante="secundario" onClick={() => setAbierto(false)} disabled={enviando}>
          Cancelar
        </Boton>
      </div>
    </form>
  );
}
