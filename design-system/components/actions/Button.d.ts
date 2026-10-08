import * as React from 'react';

/**
 * Primary action control; one primary per view, label is a verb ("Solicita", "Paga", "Postula").
 */
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger' | 'accent' | 'inverse';
  /** sm=40px (dense dashboards only), md=48px, lg=56px */
  size?: 'sm' | 'md' | 'lg';
  iconLeft?: string;
  iconRight?: string;
  loading?: boolean;
  disabled?: boolean;
  block?: boolean;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: any) => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export declare function Button(props: ButtonProps): React.JSX.Element;
