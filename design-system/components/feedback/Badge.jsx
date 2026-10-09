import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function Badge({ tone = 'neutral', solid, outline, dot, icon, size = 'md', children }) {
  const cls = ['hds-badge', tone !== 'neutral' && 'hds-badge--' + (solid ? 'solid-' : '') + tone, outline && 'hds-badge--outline', size === 'sm' && 'hds-badge--sm'].filter(Boolean).join(' ');
  return <span className={cls}>{dot && <span className="hds-badge__dot" />}{icon && <Icon name={icon} size={size === 'sm' ? 13 : 15} />}{children}</span>;
}