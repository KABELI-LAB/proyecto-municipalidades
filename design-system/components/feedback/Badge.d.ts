import * as React from 'react';

/**
 * Small pill label for categories and counts; tones map to the color logic.
 */
export interface BadgeProps {
  tone?: 'neutral' | 'blue' | 'green' | 'yellow' | 'red';
  solid?: boolean;
  outline?: boolean;
  dot?: boolean;
  icon?: string;
  size?: 'sm' | 'md';
  children?: React.ReactNode;
}

export declare function Badge(props: BadgeProps): React.JSX.Element;
