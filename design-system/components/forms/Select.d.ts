import * as React from 'react';

/**
 * Native select with brand styling — keep options under ~12, otherwise use search.
 */
export interface SelectProps {
  label: string;
  options: Array<string | { value: string; label: string }>;
  hint?: string;
  error?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  onChange?: (e: any) => void;
}

export declare function Select(props: SelectProps): React.JSX.Element;
