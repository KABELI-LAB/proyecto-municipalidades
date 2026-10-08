import * as React from 'react';

/**
 * Step-by-step status of a trámite or obra: done / current / pending, with dates.
 */
export interface TimelineProps {
  steps: Array<{ title: string; meta?: string; state: 'done' | 'current' | 'pending'; detail?: React.ReactNode }>;
}

export declare function Timeline(props: TimelineProps): React.JSX.Element;
