import * as React from 'react';
import type { MunicipioId } from './Municipio';

/**
 * Logotipo oficial del municipio activo (useMunicipio) — never redraw; pick the variant.
 */
export interface LogoProps {
  /**
   * Hualañé: institutional = escudo + "Ilustre Municipalidad de Hualañé" (Nivel A); citizen = wordmark + Somos tod@s (Nivel B); combined = original full lockup; wordmark = Hualañé only; escudo = shield only; mark = digital tile (Nivel C).
   * Curepto: escudo/mark = escudo; el resto = logotipo completo.
   * Vichuquén: horizontal (headers), vertical (portadas), escudo, avatar; citizen/combined/wordmark/institutional = horizontal; mark = escudo.
   */
  variant?: 'institutional' | 'citizen' | 'combined' | 'wordmark' | 'escudo' | 'mark' | 'horizontal' | 'vertical' | 'avatar';
  /** Rendered height in px */
  height?: number;
  /** White version for dark/brand surfaces */
  inverse?: boolean;
  /** Igual que `inverse` (nombre del design system de Vichuquén) */
  tone?: 'color' | 'white';
  /** Fuerza un municipio; por defecto, el de useMunicipio() */
  municipio?: MunicipioId;
  /** Relative path to the design-system assets folder. Default "assets" */
  base?: string;
}

export declare function Logo(props: LogoProps): React.JSX.Element;
