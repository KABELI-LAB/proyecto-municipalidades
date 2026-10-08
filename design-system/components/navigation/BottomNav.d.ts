import * as React from 'react';

/**
 * Mobile app bottom navigation, 3–5 destinations, always icon + label.
 */
export interface BottomNavProps {
  items: Array<{ id: string; label: string; icon: string; badge?: number }>;
  value?: string;
  onChange?: (id: string) => void;
}

export declare function BottomNav(props: BottomNavProps): React.JSX.Element;
