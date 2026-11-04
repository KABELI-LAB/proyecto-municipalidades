"use client";
// Cambia el municipio de la demostración: sus datos, colores, tipografía y
// logos. Se guarda en una cookie que lee src/proxy.ts, y la página se recarga
// para mostrarlo entero.
import estilos from "./FranjaDemo.module.css";

type Opcion = { id: string; nombre: string };
type Props = { opciones: Opcion[]; actual: string; cookie: string };

export function SelectorMunicipio({ opciones, actual, cookie }: Props) {
  const elegir = (id: string) => {
    if (id === actual) return;
    document.cookie = `${cookie}=${id}; path=/; max-age=${365 * 86_400}; samesite=lax`;
    window.location.reload();
  };

  return (
    <div className={estilos.selector} role="group" aria-label="Municipio de la demostración">
      <span>Ver municipio de</span>
      {opciones.map((o) => (
        <button key={o.id} type="button" className={estilos.opcion} aria-pressed={actual === o.id} onClick={() => elegir(o.id)}>
          {o.nombre}
        </button>
      ))}
    </div>
  );
}
