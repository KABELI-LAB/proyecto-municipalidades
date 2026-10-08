import * as React from 'react';

/**
 * The "¿Qué necesitas hacer?" search — the primary entry on every citizen surface.
 */
export interface SearchBarProps {
  placeholder?: string;
  size?: 'md' | 'lg';
  value?: string;
  onChange?: (e: any) => void;
  onSubmit?: (value: string) => void;
  /** Show a voice-input button */
  voice?: boolean;
  buttonLabel?: string;
}

export declare function SearchBar(props: SearchBarProps): React.JSX.Element;
