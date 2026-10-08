import * as React from 'react';

/**
 * Emergency communication: nivel (SENAPRED-aligned), zona, mensaje, hora, acción. Overrides all other content.
 */
export interface EmergencyAlertProps {
  level: 'preventiva' | 'amarilla' | 'roja';
  title: string;
  zone: string;
  message: string;
  time: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  /** banner = full-width strip; card = standalone panel */
  layout?: 'banner' | 'card';
}

export declare function EmergencyAlert(props: EmergencyAlertProps): React.JSX.Element;
