import * as React from 'react';

/**
 * Suggested replies as large pill chips — reduce typing for low-literacy and mobile users.
 */
export interface QuickRepliesProps {
  options: Array<string | { label: string; icon?: string }>;
  onSelect?: (label: string) => void;
  selected?: string;
}

export declare function QuickReplies(props: QuickRepliesProps): React.JSX.Element;
