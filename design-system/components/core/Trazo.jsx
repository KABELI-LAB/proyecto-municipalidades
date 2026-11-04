import React from 'react';
/*
 * Trazo: la curva bajo "Avanzando juntos", fina a la izquierda y engrosándose al
 * subir. Subraya un título por pantalla y marca el ítem activo de la navegación.
 * `tone`: brand (sobre blanco), accent (dorado, solo sobre teal), onBrand (blanco).
 */
export function Trazo({ width = 120, tone = 'brand', className }) {
  return (
    <svg className={['hds-trazo', `hds-trazo--${tone}`, className].filter(Boolean).join(' ')} width={width} height={Math.max(6, width / 14)} viewBox="0 0 140 10" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 9.4 C 40 7.6, 90 4.2, 140 0.4 L 140 4.6 C 92 7, 44 9.2, 0 9.8 Z" />
    </svg>
  );
}
