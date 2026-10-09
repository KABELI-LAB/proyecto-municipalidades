import * as React from 'react';

/**
 * Base surface: 20px radius, 1px border, no shadow at rest; interactive cards lift on hover.
 */
export interface CardProps {
  variant?: 'outline' | 'flat' | 'raised';
  interactive?: boolean;
  href?: string;
  padded?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export declare function Card(props: CardProps): React.JSX.Element;
