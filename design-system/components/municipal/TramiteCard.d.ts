import * as React from 'react';

/**
 * Trámite summary that answers before the click: what, requisitos, costo, duración, modalidad, estado, CTA.
 */
export interface TramiteCardProps {
  title: string;
  description?: string;
  icon?: string;
  category?: string;
  requirements?: string[];
  cost?: string;
  duration?: string;
  modality?: 'En línea' | 'Presencial' | 'En línea o presencial' | string;
  status?: 'operativo' | 'intermitente' | 'suspendido' | 'finalizado';
  cta?: string;
  onAction?: () => void;
  compact?: boolean;
}

export declare function TramiteCard(props: TramiteCardProps): React.JSX.Element;
