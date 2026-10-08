import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function IconButton({ icon, label, variant = 'ghost', size = 'md', round, disabled, onClick }) {
  const cls = ['hds-btn', 'hds-iconbtn', 'hds-btn--' + variant, size !== 'md' && 'hds-btn--' + size, round && 'hds-iconbtn--round'].filter(Boolean).join(' ');
  return <button type="button" className={cls} aria-label={label} title={label} disabled={disabled} onClick={onClick}><Icon name={icon} size={size === 'lg' ? 24 : size === 'sm' ? 18 : 22} /></button>;
}