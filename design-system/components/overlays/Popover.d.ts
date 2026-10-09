import * as React from 'react';

/**
 * Anchored panel for small menus (language, text size, account) — dismiss on outside click.
 */
export interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export declare function Popover(props: PopoverProps): React.JSX.Element;
