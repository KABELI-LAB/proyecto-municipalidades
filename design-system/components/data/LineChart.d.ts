import * as React from 'react';

/**
 * Single/multi series line chart for trends over time; direct end labels, light gridlines.
 */
export interface LineChartProps {
  labels: string[];
  series: Array<{ name: string; values: number[]; color?: string }>;
  height?: number;
  format?: (v: number) => string;
}

export declare function LineChart(props: LineChartProps): React.JSX.Element;
