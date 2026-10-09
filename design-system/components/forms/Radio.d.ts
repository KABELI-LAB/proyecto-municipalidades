import * as React from 'react';

/**
 * Single radio option; group several with the same name inside a <fieldset>.
 */
export interface RadioProps {
  label: React.ReactNode;
  name: string;
  value: string;
  description?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (e: any) => void;
}

export declare function Radio(props: RadioProps): React.JSX.Element;
