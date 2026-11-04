import React from 'react';
/*
 * Oleaje: banda de tres ondas tomada de la mitad derecha del escudo (el mar de
 * Llico y el lago): primario, teal-300 y un hilo dorado. Una por pieza, al pie de
 * portadas y footer. `tone`: brand (sobre blanco), onBrand (sobre teal), soft (separador).
 */
export function Oleaje({ tone = 'brand', height = 40, className }) {
  return (
    <svg className={['hds-oleaje', `hds-oleaje--${tone}`, className].filter(Boolean).join(' ')} viewBox="0 0 400 40" preserveAspectRatio="none" width="100%" height={height} aria-hidden="true">
      <path className="o1" d="M0 12 C 50 2, 100 2, 150 12 S 250 22, 300 12 S 370 4, 400 8" />
      <path className="o2" d="M0 24 C 50 14, 100 14, 150 24 S 250 34, 300 24 S 370 16, 400 20" />
      <path className="o3" d="M0 35 C 60 29, 120 29, 180 35 S 300 39, 400 32" />
    </svg>
  );
}
