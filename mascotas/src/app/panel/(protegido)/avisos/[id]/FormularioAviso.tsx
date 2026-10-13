"use client";
import { useState, useTransition } from "react";
import { Boton } from "@/componentes/Boton";
import { CampoArea, CampoTexto } from "@/componentes/formulario/Campos";
import { useMensaje } from "@/componentes/panel/Mensajes";
import { guardarAviso } from "@/servidor/panel/acciones-avisos";
import formulario from "@/componentes/formulario/formulario.module.css";

type Valores = { titulo: string; texto: string; desde: string; hasta: string };

export function FormularioAviso({ id, inicial }: { id: string; inicial: Valores }) {
  const [v, setV] = useState(inicial);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, iniciar] = useTransition();
  const mostrar = useMensaje();
  const cambiar = (campo: keyof Valores) => (x: string) => setV((a) => ({ ...a, [campo]: x }));

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    iniciar(async () => {
      const r = await guardarAviso(id, v);
      setErrores(r.errores ?? {});
      mostrar({ ok: r.ok, texto: r.mensaje });
    });
  }

  return (
    <form onSubmit={guardar} className={formulario.cuerpo} noValidate>
      <CampoTexto id="titulo" etiqueta="Título" valor={v.titulo} alCambiar={cambiar("titulo")} error={errores.titulo} maxLength={90} />
      <CampoArea id="texto" etiqueta="Texto" valor={v.texto} alCambiar={cambiar("texto")} error={errores.texto} maxLength={400} ayuda="Trato de usted, sin mayúsculas sostenidas. Use corchetes para datos por confirmar, por ejemplo [fecha]." />
      <div className={formulario.fila}>
        <CampoTexto id="desde" tipo="date" etiqueta="Vigente desde" valor={v.desde} alCambiar={cambiar("desde")} error={errores.desde} />
        <CampoTexto id="hasta" tipo="date" etiqueta="Vigente hasta" valor={v.hasta} alCambiar={cambiar("hasta")} error={errores.hasta} />
      </div>
      <div>
        <Boton type="submit" variante="secundario" disabled={enviando}>
          Guardar cambios
        </Boton>
      </div>
    </form>
  );
}
