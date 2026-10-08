import * as React from 'react';

/**
 * Zero-results / nothing-yet message with a next step — never a dead end.
 */
export interface EmptyStateProps {
  icon?: string;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}

export declare function EmptyState(props: EmptyStateProps): React.JSX.Element;
