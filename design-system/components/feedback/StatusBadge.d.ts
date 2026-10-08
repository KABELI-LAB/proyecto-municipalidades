import * as React from 'react';

/**
 * Service / trámite status pill: Operativo, Intermitente, Suspendido, Finalizado, plus procedure states.
 */
export interface StatusBadgeProps {
  status: 'operativo' | 'intermitente' | 'suspendido' | 'finalizado' | 'recibida' | 'en-revision' | 'aprobada' | 'rechazada' | 'abierta' | 'cerrada' | 'proxima';
  label?: string;
  size?: 'sm' | 'md';
}

export declare function StatusBadge(props: StatusBadgeProps): React.JSX.Element;
