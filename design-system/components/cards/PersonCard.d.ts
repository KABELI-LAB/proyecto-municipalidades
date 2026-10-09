import * as React from 'react';

/**
 * Funcionario / contact card: who to talk to, for what, and how to reach them.
 */
export interface PersonCardProps {
  name: string;
  role: string;
  unit?: string;
  phone?: string;
  email?: string;
  hours?: string;
  photo?: string;
}

export declare function PersonCard(props: PersonCardProps): React.JSX.Element;
