import * as React from 'react';

/**
 * Underline tabs for switching views of the same content (e.g. Requisitos / Paso a paso / Contacto).
 */
export interface TabsProps {
  items: Array<{ id: string; label: string; count?: number; icon?: string }>;
  value?: string;
  onChange?: (id: string) => void;
}

export declare function Tabs(props: TabsProps): React.JSX.Element;
