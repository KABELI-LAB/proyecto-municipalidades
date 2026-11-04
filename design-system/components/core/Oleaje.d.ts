import * as React from 'react';

/** Banda de tres ondas del escudo de Vichuquén. Una por pieza; no la combines con el Trazo en el mismo bloque. */
export interface OleajeProps {
  /** brand sobre blanco · onBrand sobre teal · soft como separador */
  tone?: 'brand' | 'onBrand' | 'soft';
  /** Alto en px. Default 40 */
  height?: number;
  className?: string;
}

export declare function Oleaje(props: OleajeProps): React.JSX.Element;
