import * as React from 'react';

/**
 * Numbered pagination with text Prev/Next; 48px targets.
 */
export interface PaginationProps {
  page: number;
  total: number;
  onChange?: (page: number) => void;
}

export declare function Pagination(props: PaginationProps): React.JSX.Element;
