import * as React from 'react';

/**
 * Square/round icon-only button with required accessible label (48px minimum target).
 */
export interface IconButtonProps {
  icon: string;
  /** Required — read by screen readers and shown as tooltip */
  label: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger' | 'accent' | 'inverse';
  size?: 'sm' | 'md' | 'lg';
  round?: boolean;
  disabled?: boolean;
  onClick?: (e: any) => void;
}

export declare function IconButton(props: IconButtonProps): React.JSX.Element;
