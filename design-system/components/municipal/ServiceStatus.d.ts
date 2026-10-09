import * as React from 'react';

/**
 * Service availability row: Operativo / Intermitente / Suspendido / Finalizado with last update.
 */
export interface ServiceStatusProps {
  name: string;
  status: 'operativo' | 'intermitente' | 'suspendido' | 'finalizado';
  detail?: string;
  updated?: string;
  icon?: string;
}

export declare function ServiceStatus(props: ServiceStatusProps): React.JSX.Element;
