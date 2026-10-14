// Cauce: las tres ondas del escudo (río Mataquito), forma propia del sistema
// de diseño. Sube de izquierda a derecha y se aplana. Solo decorativo.
const TRAZO = {
  sube: (y: number) => `M-40 ${y + 150} C 260 ${y + 150}, 470 ${y + 20}, 760 ${y} S 1120 ${y - 14}, 1240 ${y - 14}`,
  plano: (y: number) => `M-40 ${y + 40} C 200 ${y + 40}, 360 ${y - 30}, 600 ${y - 30} S 1000 ${y + 40}, 1240 ${y + 20}`,
};

/** Combinaciones de los kits del sistema: suave (portadas), río y sobre azul. */
const COLORES = {
  suave: ["var(--blue-100)", "var(--green-100)", "var(--yellow-100)"],
  rio: ["var(--blue-500)", "var(--blue-600)", "var(--blue-700)"],
  sobreAzul: ["var(--blue-600)", "var(--blue-700)", "var(--green-700)"],
};

type Props = {
  colores?: keyof typeof COLORES;
  forma?: keyof typeof TRAZO;
  grosor?: number;
  separacion?: number;
  className?: string;
};

export function Cauce({ colores = "suave", forma = "sube", grosor = 16, separacion = 56, className }: Props) {
  const inicio = forma === "sube" ? 120 : 160;
  return (
    <svg className={className} viewBox="0 0 1200 400" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {COLORES[colores].map((color, i) => (
        <path key={i} d={TRAZO[forma](inicio + i * separacion)} fill="none" stroke={color} strokeWidth={grosor} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
