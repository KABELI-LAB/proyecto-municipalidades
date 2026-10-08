import * as React from 'react';

/**
 * The river-band shape primitive (from the shield waves) for backgrounds, separators and photo masks.
 */
export interface CauceProps {
  /** Number of bands, default 3 */
  bands?: number;
  /** Band colors, top→bottom */
  colors?: string[];
  /** Band thickness in CSS px (non-scaling — bands stretch to fill the box, strokes stay crisp) */
  thickness?: number;
  /** Vertical distance between bands in viewBox units (viewBox is 1200×400) */
  gap?: number;
  /** "rise" climbs left→right like the shield; "flat" is a gentle meander */
  shape?: 'rise' | 'flat';
  style?: React.CSSProperties;
}

export declare function Cauce(props: CauceProps): React.JSX.Element;
