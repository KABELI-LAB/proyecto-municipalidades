"use client";
// Entrada del cuidador desde la ficha del perro: con la sesión de Mis
// solicitudes (entró con su correo), la misma gestión que allí (lo vi hoy,
// actualizar ficha, novedades por leer, ya no está). Sin sesión, lleva a entrar.
import { useCallback, useEffect, useState, useTransition } from "react";
import { EnlaceBoton } from "@/componentes/Boton";
import { Icono } from "@/componentes/Icono";
import { entrarComoCuidador, type PerroACargo } from "@/servidor/portal/acciones-comunitarios";
import { GestionComunitario } from "../../../mis-solicitudes/GestionComunitario";
import formulario from "@/componentes/formulario/formulario.module.css";
import estilos from "../../../mis-solicitudes/mis-solicitudes.module.css";

export function EntradaCuidador({ perroId }: { perroId: string }) {
  const [perro, setPerro] = useState<{ datos: PerroACargo; codigo: string } | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [cargando, iniciar] = useTransition();

  const cargar = useCallback(
    () =>
      iniciar(async () => {
        const r = await entrarComoCuidador({ perroId });
        if (r.ok) {
          setPerro({ datos: r.perro, codigo: r.codigo });
          setMensaje(null);
        } else setMensaje(r.mensaje);
      }),
    [perroId],
  );

  useEffect(cargar, [cargar]);

  if (perro) {
    return (
      <section className={`${formulario.formulario} ${formulario.formularioCorto}`} aria-label={`Gestión de ${perro.datos.apodo}`} aria-live="polite">
        {aviso && (
          <p className={estilos.confirmacion} role="status">
            <Icono nombre="check" tamano={20} />
            {aviso}
          </p>
        )}
        <GestionComunitario
          key={aviso ?? "inicio"}
          codigo={perro.codigo}
          perro={perro.datos}
          alTerminar={(texto) => {
            setAviso(texto);
            // Vuelve a leer las novedades y el estado tras cada acción.
            cargar();
          }}
        />
      </section>
    );
  }

  if (!mensaje) return <div className={estilos.esqueleto} aria-label="Cargando" aria-busy={cargando} />;

  return (
    <div className={`${formulario.formulario} ${formulario.formularioCorto}`}>
      <p role="alert">{mensaje}</p>
      <div className={formulario.navegacion}>
        <EnlaceBoton href="/mis-solicitudes">Ir a Mis solicitudes</EnlaceBoton>
      </div>
    </div>
  );
}
