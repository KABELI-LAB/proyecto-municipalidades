"use client";
// Entrada del cuidador desde la ficha del perro: RUT y código de cuidador, y
// luego la misma gestión que en Mis solicitudes (lo vi hoy, actualizar ficha,
// novedades por leer, ya no está). El RUT viaja en el cuerpo, nunca en la URL.
import { useState, useTransition } from "react";
import { Boton } from "@/componentes/Boton";
import { CampoTexto } from "@/componentes/formulario/Campos";
import { Icono } from "@/componentes/Icono";
import { entrarComoCuidador, type PerroACargo } from "@/servidor/portal/acciones-comunitarios";
import { GestionComunitario } from "../../../mis-solicitudes/GestionComunitario";
import formulario from "@/componentes/formulario/formulario.module.css";
import estilos from "../../../mis-solicitudes/mis-solicitudes.module.css";

export function EntradaCuidador({ perroId }: { perroId: string }) {
  const [v, setV] = useState({ rut: "", codigo: "" });
  const [perro, setPerro] = useState<PerroACargo | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  const entrar = (e?: React.FormEvent) => {
    e?.preventDefault();
    iniciar(async () => {
      const r = await entrarComoCuidador({ perroId, ...v });
      if (r.ok) {
        setPerro(r.perro);
        setMensaje(null);
      } else setMensaje(r.mensaje);
    });
  };

  if (perro) {
    return (
      <section className={`${formulario.formulario} ${formulario.formularioCorto}`} aria-label={`Gestión de ${perro.apodo}`} aria-live="polite">
        {aviso && (
          <p className={estilos.confirmacion} role="status">
            <Icono nombre="check" tamano={20} />
            {aviso}
          </p>
        )}
        <GestionComunitario
          key={aviso ?? "inicio"}
          rut={v.rut}
          codigo={v.codigo}
          perro={perro}
          alTerminar={(texto) => {
            setAviso(texto);
            // Vuelve a leer las novedades y el estado tras cada acción.
            entrar();
          }}
        />
      </section>
    );
  }

  return (
    <form className={`${formulario.formulario} ${formulario.formularioCorto}`} onSubmit={entrar} noValidate aria-label="Entrar como cuidador">
      <p>Use el RUT y el código de cuidador que recibió al registrarlo o al hacerse cargo. También los encuentra en Mis solicitudes.</p>
      <div className={formulario.fila}>
        <CampoTexto id="rut" etiqueta="RUT" valor={v.rut} alCambiar={(x) => setV((s) => ({ ...s, rut: x }))} ayuda="Por ejemplo, 12.345.678-5." maxLength={12} />
        <CampoTexto id="codigo" etiqueta="Código de cuidador" valor={v.codigo} alCambiar={(x) => setV((s) => ({ ...s, codigo: x.toUpperCase() }))} ayuda="Por ejemplo, TR-4043." maxLength={7} />
      </div>
      {mensaje && (
        <p className={formulario.mensaje} role="alert">
          <Icono nombre="alerta" tamano={20} />
          {mensaje}
        </p>
      )}
      <div className={formulario.navegacion}>
        <Boton type="submit" disabled={enviando}>
          {enviando ? "Un momento…" : "Entrar"}
        </Boton>
      </div>
    </form>
  );
}
