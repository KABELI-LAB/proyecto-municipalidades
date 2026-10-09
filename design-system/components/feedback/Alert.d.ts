import * as React from 'react';

/**
 * Inline message for success / error / warning / information; title states what happened, body says what to do.
 */
export interface AlertProps {
  tone?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  onClose?: () => void;
}

export declare function Alert(props: AlertProps): React.JSX.Element;
