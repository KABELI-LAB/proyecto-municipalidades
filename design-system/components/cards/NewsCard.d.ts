import * as React from 'react';

/**
 * News item with real photo, category overline, title and date. News comes AFTER services.
 */
export interface NewsCardProps {
  image?: string;
  category?: string;
  title: string;
  excerpt?: string;
  date?: string;
  href?: string;
  layout?: 'vertical' | 'horizontal';
}

export declare function NewsCard(props: NewsCardProps): React.JSX.Element;
