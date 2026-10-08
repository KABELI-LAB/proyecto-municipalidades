import * as React from 'react';

/**
 * Location trail for portal depth ≥2; last item is the current page (not a link).
 */
export interface BreadcrumbsProps {
  items: Array<{ label: string; href?: string }>;
}

export declare function Breadcrumbs(props: BreadcrumbsProps): React.JSX.Element;
