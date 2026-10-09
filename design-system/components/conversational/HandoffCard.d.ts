import * as React from 'react';

/**
 * Transfer from assistant to a real funcionario: who, when, and the case number so nothing is repeated.
 */
export interface HandoffCardProps {
  name: string;
  role: string;
  eta?: string;
  caseId?: string;
  state?: 'waiting' | 'connected';
}

export declare function HandoffCard(props: HandoffCardProps): React.JSX.Element;
