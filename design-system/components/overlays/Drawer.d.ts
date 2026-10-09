import * as React from 'react';

/**
 * Side or bottom sheet for filters, details and mobile menus; positioned inside its relative parent.
 */
export interface DrawerProps {
  open?: boolean;
  side?: 'right' | 'left' | 'bottom';
  title: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onClose?: () => void;
}

export declare function Drawer(props: DrawerProps): React.JSX.Element;
