// Adornos de los tres bloques principales de la portada: un pequeño grupo de
// huellas y corazones en el rincón inferior derecho de cada tarjeta, en un
// tono suave del mismo color de la tarjeta (vía currentColor, desde
// inicio.module.css), para que se vean sin distraer. Son decorativos: ocultos
// para lectores de pantalla y siempre detrás del texto.
import inicio from "./inicio.module.css";

/** Huella: almohadilla principal y cuatro dedos, en una caja de 24 × 24. */
function Huella({ x, y, escala, giro, opacidad = 1 }: { x: number; y: number; escala: number; giro: number; opacidad?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${giro}) scale(${escala}) translate(-12 -12)`} opacity={opacidad}>
      <path d="M12 12.6c-2.9 0-6 2.7-6 5.4 0 1.8 1.3 2.9 3 2.9 1.2 0 2-.7 3-.7s1.8.7 3 .7c1.7 0 3-1.1 3-2.9 0-2.7-3.1-5.4-6-5.4z" />
      <ellipse cx="5.4" cy="10.2" rx="2" ry="2.6" transform="rotate(-28 5.4 10.2)" />
      <ellipse cx="9.3" cy="5.6" rx="2.1" ry="2.8" transform="rotate(-10 9.3 5.6)" />
      <ellipse cx="14.7" cy="5.6" rx="2.1" ry="2.8" transform="rotate(10 14.7 5.6)" />
      <ellipse cx="18.6" cy="10.2" rx="2" ry="2.6" transform="rotate(28 18.6 10.2)" />
    </g>
  );
}

/** Corazón en una caja de 24 × 24. */
function Corazon({ x, y, escala, giro, opacidad = 1 }: { x: number; y: number; escala: number; giro: number; opacidad?: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) rotate(${giro}) scale(${escala}) translate(-12 -12)`}
      opacity={opacidad}
      d="M12 21.2s-8.6-5.3-8.6-11.5A4.9 4.9 0 0 1 12 6.6a4.9 4.9 0 0 1 8.6 3.1c0 6.2-8.6 11.5-8.6 11.5z"
    />
  );
}

/** Rincón de 140 × 100 dentro de la tarjeta. */
function Rincon({ children }: { children: React.ReactNode }) {
  return (
    <svg className={inicio.adornos} viewBox="0 0 140 100" fill="currentColor" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

/** Tres pasos que suben hacia la derecha y un corazón. */
function Paseo() {
  return (
    <>
      <Huella x={22} y={80} escala={1.05} giro={34} />
      <Huella x={54} y={60} escala={1.15} giro={26} />
      <Huella x={86} y={34} escala={1.25} giro={32} />
      <Corazon x={120} y={76} escala={1.25} giro={12} />
    </>
  );
}

export function AdornoOperativos() {
  return (
    <Rincon>
      <Paseo />
    </Rincon>
  );
}

export function AdornoMascotas() {
  return (
    <Rincon>
      <Paseo />
    </Rincon>
  );
}

/** SOS: un corazón con una huella adentro y un corazón pequeño. */
export function AdornoSos() {
  return (
    <Rincon>
      <Corazon x={96} y={54} escala={3.3} giro={-8} />
      <Huella x={96} y={50} escala={1.25} giro={-8} opacidad={0.55} />
      <Corazon x={30} y={78} escala={1} giro={-16} />
    </Rincon>
  );
}
