"use client";
import { useState, useTransition } from "react";
import { Boton } from "@/componentes/Boton";
import { CampoArea, CampoTexto } from "@/componentes/formulario/Campos";
import { Icono } from "@/componentes/Icono";
import { esquemaMensaje, validarCampos, type Errores } from "@/lib/esquemas";
import { enviarMensaje, reportarPublicacion } from "@/servidor/portal/acciones";
import estilos from "@/componentes/formulario/formulario.module.css";

/**
 * Contacto protegido: el mensaje va por la plataforma a quien publicó un aviso
 * (`publicacionId`) o a quien da en adopción (`fichaId`).
 */
export function FormularioMensaje({ publicacionId = "", fichaId = "", ayudaTexto = "Por ejemplo, dónde y cuándo viste al animal. No incluyas direcciones exactas." }: { publicacionId?: string; fichaId?: string; ayudaTexto?: string }) {
  const vacio = { publicacionId, fichaId, nombre: "", telefono: "", correo: "", texto: "" };
  const [v, setV] = useState(vacio);
  const [errores, setErrores] = useState<Errores>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [enviando, iniciar] = useTransition();
  const cambiar = (campo: keyof typeof vacio) => (valor: string) => setV((x) => ({ ...x, [campo]: valor }));

  if (enviado) {
    return (
      <div className={estilos.resultado} role="status">
        <h3 className={estilos.tituloResultado}>
          <Icono nombre="check" tamano={28} />
          Tu mensaje fue enviado
        </h3>
        <p>Se lo enviamos a la persona que publicó, sin mostrarle tu correo ni tu teléfono. Si te responde, te llegará a tu correo.</p>
      </div>
    );
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const err = validarCampos(esquemaMensaje, v);
    setErrores(err);
    if (Object.keys(err).length > 0) return;
    iniciar(async () => {
      const r = await enviarMensaje(v);
      if (r.ok) setEnviado(true);
      else {
        setErrores(r.errores ?? {});
        setMensaje(r.mensaje ?? null);
      }
    });
  }

  return (
    <form className={estilos.formulario} onSubmit={enviar} noValidate>
      <CampoTexto id="nombre" etiqueta="Tu nombre" valor={v.nombre} alCambiar={cambiar("nombre")} error={errores.nombre} autoComplete="name" maxLength={100} />
      <div className={estilos.fila}>
        <CampoTexto id="correo" etiqueta="Tu correo" tipo="email" valor={v.correo} alCambiar={cambiar("correo")} error={errores.correo} autoComplete="email" maxLength={120} />
        <CampoTexto id="telefono" etiqueta="Teléfono (opcional)" tipo="tel" valor={v.telefono} alCambiar={cambiar("telefono")} error={errores.telefono} autoComplete="tel" maxLength={20} />
      </div>
      <p className={estilos.ayuda}>Ahí te llegará la respuesta. No se muestra a la otra persona.</p>
      <CampoArea id="texto" etiqueta="Mensaje" valor={v.texto} alCambiar={cambiar("texto")} error={errores.texto} maxLength={500} ayuda={ayudaTexto} />
      {mensaje && (
        <p className={estilos.mensaje} role="alert">
          <Icono nombre="alerta" tamano={20} />
          {mensaje}
        </p>
      )}
      <div className={estilos.navegacion}>
        <Boton type="submit" disabled={enviando}>
          {enviando ? "Enviando…" : "Enviar mensaje"}
        </Boton>
      </div>
    </form>
  );
}

/** Envía la publicación a la bandeja de moderación. */
export function BotonReportar({ publicacionId }: { publicacionId: string }) {
  const [estado, setEstado] = useState<"inicial" | "confirmar" | "hecho">("inicial");
  const [enviando, iniciar] = useTransition();

  if (estado === "hecho") {
    return <p role="status">Gracias. El equipo municipal revisará esta publicación.</p>;
  }
  if (estado === "confirmar") {
    return (
      <div className={estilos.navegacion}>
        <p>¿Quieres reportar esta publicación como inapropiada o falsa?</p>
        <Boton variante="secundario" disabled={enviando} onClick={() => iniciar(async () => { await reportarPublicacion(publicacionId); setEstado("hecho"); })}>
          Sí, reportar
        </Boton>
        <Boton variante="secundario" onClick={() => setEstado("inicial")}>
          Cancelar
        </Boton>
      </div>
    );
  }
  return (
    <Boton variante="secundario" onClick={() => setEstado("confirmar")}>
      Reportar publicación
    </Boton>
  );
}
