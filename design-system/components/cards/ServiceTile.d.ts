import * as React from 'react';

/**
 * Quick-access tile for the "¿Qué necesitas hacer?" grid — icon, need-based label, optional hint.
 */
export interface ServiceTileProps {
  icon: string;
  label: string;
  hint?: string;
  tone?: 'blue' | 'green' | 'yellow' | 'red';
  href?: string;
  layout?: 'stack' | 'row';
  onClick?: () => void;
}

export declare function ServiceTile(props: ServiceTileProps): React.JSX.Element;
