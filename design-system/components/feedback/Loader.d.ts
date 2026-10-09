import * as React from 'react';

/**
 * Loading feedback: spinner with a plain-language message, or skeleton blocks for content.
 */
export interface LoaderProps {
  /** spinner (with label) or skeleton lines */
  kind?: 'spinner' | 'skeleton';
  label?: string;
  lines?: number;
}

export declare function Loader(props: LoaderProps): React.JSX.Element;
