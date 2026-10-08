import * as React from 'react';

/**
 * Benefit/subsidy card: who it is for, what you need, deadline, and Postular.
 */
export interface BeneficioCardProps {
  title: string;
  audience: string;
  requirements?: string[];
  deadline?: string;
  /** Days left — shows urgency in yellow when ≤ 7 */
  daysLeft?: number;
  amount?: string;
  status?: 'abierta' | 'cerrada' | 'proxima';
  icon?: string;
  onApply?: () => void;
}

export declare function BeneficioCard(props: BeneficioCardProps): React.JSX.Element;
