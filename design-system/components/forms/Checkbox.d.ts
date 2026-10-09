import * as React from 'react';

/**
 * Checkbox with 26px box and 48px row target; supports a description line.
 */
export interface CheckboxProps {
  label: React.ReactNode;
  description?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (e: any) => void;
  name?: string;
}

export declare function Checkbox(props: CheckboxProps): React.JSX.Element;
