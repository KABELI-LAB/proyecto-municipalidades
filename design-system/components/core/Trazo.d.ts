import * as React from 'react';

/** Curva del lema "Avanzando juntos". Máximo uno por pantalla, bajo un título o en el ítem activo de la navegación. */
export interface TrazoProps {
  /** Ancho en px (≈ 40% del título que subraya). Default 120 */
  width?: number;
  /** brand sobre blanco · accent (dorado) solo sobre teal · onBrand blanco */
  tone?: 'brand' | 'accent' | 'onBrand';
  className?: string;
}

export declare function Trazo(props: TrazoProps): React.JSX.Element;
