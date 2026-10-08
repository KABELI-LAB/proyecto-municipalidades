import * as React from 'react';

/**
 * Official Hualañé lockups (escudo, wordmark, combined) — never redraw; pick the level A/B/C variant.
 */
export interface LogoProps {
  /** institutional = escudo + "Ilustre Municipalidad de Hualañé" (Nivel A); citizen = wordmark + Somos tod@s (Nivel B); combined = original full lockup; wordmark = Hualañé only; escudo = shield only; mark = digital tile (Nivel C) */
  variant?: 'institutional' | 'citizen' | 'combined' | 'wordmark' | 'escudo' | 'mark';
  /** Rendered height in px */
  height?: number;
  /** White version for dark/brand surfaces (institutional, combined vertical) */
  inverse?: boolean;
  /** Relative path to the design-system assets folder. Default "assets" */
  base?: string;
}

export declare function Logo(props: LogoProps): React.JSX.Element;
