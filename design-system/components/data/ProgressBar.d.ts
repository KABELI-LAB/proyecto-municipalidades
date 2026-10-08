import * as React from 'react';

/**
 * Determinate or indeterminate progress for obras, uploads and multi-step forms.
 */
export interface ProgressBarProps {
  value?: number;
  label?: string;
  showValue?: boolean;
  tone?: 'blue' | 'green' | 'yellow';
  size?: 'md' | 'lg';
  indeterminate?: boolean;
}

export declare function ProgressBar(props: ProgressBarProps): React.JSX.Element;
