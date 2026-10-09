import * as React from 'react';

/**
 * Lucide stroke icon, fetched once and inlined as SVG (stroke = currentColor); use for every UI glyph.
 */
export interface IconProps {
  /** Lucide icon name, e.g. "file-text", "heart-pulse", "map-pin" */
  name: string;
  /** px, default 20 */
  size?: number;
  /** Accessible label; omit for decorative icons */
  label?: string;
  style?: React.CSSProperties;
  className?: string;
  /** Override the default 2px Lucide stroke (e.g. 1.75 for large display icons) */
  strokeWidth?: number;
}

export declare function Icon(props: IconProps): React.JSX.Element;
