import * as React from 'react';

/**
 * Vertical navigation for internal systems and dashboards, with optional groups and counters.
 */
export interface SidebarProps {
  groups: Array<{ title?: string; items: Array<{ id: string; label: string; icon: string; badge?: number }> }>;
  value?: string;
  onChange?: (id: string) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export declare function Sidebar(props: SidebarProps): React.JSX.Element;
