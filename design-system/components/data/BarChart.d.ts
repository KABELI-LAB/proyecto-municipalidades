import * as React from 'react';

/**
 * Horizontal or vertical bars with direct labels (no legends needed); one highlight color, rest muted.
 */
export interface BarChartProps {
  data: Array<{ label: string; value: number; highlight?: boolean }>;
  orientation?: 'horizontal' | 'vertical';
  /** Format the value label */
  format?: (v: number) => string;
  color?: string;
  height?: number;
  max?: number;
}

export declare function BarChart(props: BarChartProps): React.JSX.Element;
