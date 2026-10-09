import * as React from 'react';

/**
 * Community activity: date block, title, place, time and registration CTA.
 */
export interface EventCardProps {
  day: string;
  month: string;
  title: string;
  place: string;
  time?: string;
  category?: string;
  registration?: 'open' | 'free' | 'full' | 'none';
  image?: string;
  onRegister?: () => void;
}

export declare function EventCard(props: EventCardProps): React.JSX.Element;
