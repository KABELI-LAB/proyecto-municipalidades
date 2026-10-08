import * as React from 'react';

/**
 * KPI tile: label, mono value, unit, delta vs. previous period, optional progress.
 */
export interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
  /** Whether "up" is good (default true) */
  upIsGood?: boolean;
  icon?: string;
  progress?: number;
  caption?: string;
}

export declare function MetricCard(props: MetricCardProps): React.JSX.Element;
