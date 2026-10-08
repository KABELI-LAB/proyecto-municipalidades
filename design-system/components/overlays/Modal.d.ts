import * as React from 'react';

/**
 * Centered dialog for confirmations and short decisions; one clear primary action.
 */
export interface ModalProps {
  open?: boolean;
  title: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onClose?: () => void;
  /** Render in-flow (for documentation / previews) instead of fixed */
  inline?: boolean;
  icon?: string;
  iconTone?: 'blue' | 'green' | 'yellow' | 'red';
}

export declare function Modal(props: ModalProps): React.JSX.Element;
