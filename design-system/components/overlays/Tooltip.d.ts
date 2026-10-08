import * as React from 'react';

/**
 * Short helper text on hover AND keyboard focus; never hide required information in it.
 */
export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  /** Force visible (docs) */
  open?: boolean;
}

export declare function Tooltip(props: TooltipProps): React.JSX.Element;
