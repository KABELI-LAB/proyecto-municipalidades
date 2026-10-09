import * as React from 'react';

/**
 * Labelled text input (text, search, date, time, email, tel, textarea) with hint and plain-language error.
 */
export interface TextFieldProps {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  type?: 'text' | 'search' | 'date' | 'time' | 'email' | 'tel' | 'number';
  multiline?: boolean;
  icon?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  onChange?: (e: any) => void;
  id?: string;
}

export declare function TextField(props: TextFieldProps): React.JSX.Element;
