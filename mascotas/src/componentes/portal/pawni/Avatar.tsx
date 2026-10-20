// Pawni en su círculo: las cuatro ilustraciones apiladas y una visible según
// el ánimo (cambio con fundido), con un movimiento propio de cada ánimo:
// respira en reposo, saluda balanceándose, salta de alegría y ladea la cabeza
// cuando está atento. Sin movimiento si el sistema pide reducirlo.
import type { AnimoPawni } from "@/dominio/asistente";
import estilos from "./pawni.module.css";

const ANIMOS: AnimoPawni[] = ["reposo", "saluda", "feliz", "atento"];

type Props = { animo: AnimoPawni; tamano: number; className?: string };

export function AvatarPawni({ animo, tamano, className }: Props) {
  return (
    <span className={[estilos.avatar, className].filter(Boolean).join(" ")} style={{ width: tamano, height: tamano }} aria-hidden="true">
      {/* La clave reinicia el movimiento cada vez que cambia el ánimo. */}
      <span key={animo} className={`${estilos.figura} ${estilos[`mueve-${animo}`]}`}>
        {ANIMOS.map((a) => (
          // eslint-disable-next-line @next/next/no-img-element -- ilustraciones pequeñas ya optimizadas en dos tamaños
          <img
            key={a}
            src={`/pawni/${a}-160.webp`}
            srcSet={`/pawni/${a}-160.webp 1x, /pawni/${a}-320.webp 2x`}
            width={tamano}
            height={tamano}
            alt=""
            className={a === animo ? estilos.visible : undefined}
            decoding="async"
          />
        ))}
      </span>
    </span>
  );
}
