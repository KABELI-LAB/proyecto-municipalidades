import * as React from 'react';

/**
 * Part-to-whole for ≤5 categories, with center total and a direct legend.
 */
export interface DonutChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}

export declare function DonutChart(props: DonutChartProps): React.JSX.Element;
