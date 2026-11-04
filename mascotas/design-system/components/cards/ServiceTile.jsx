import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function ServiceTile({ icon, label, hint, tone = 'blue', href = '#', layout = 'stack', onClick }) {
  const row = layout === 'row';
  return (
    <a href={href} onClick={onClick ? (e) => { e.preventDefault(); onClick(); } : undefined} className="hds-card hds-card--interactive"
      style={{ padding: row ? '14px 16px' : 20, flexDirection: row ? 'row' : 'column', alignItems: row ? 'center' : 'flex-start', gap: row ? 14 : 16, minHeight: row ? 72 : 148 }}>
      <span className={'hds-tile-icon hds-tile-icon--' + tone}><Icon name={icon} size={24} /></span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        <span style={{ fontWeight: 700, fontSize: 19, lineHeight: 1.25, color: 'var(--color-text)' }}>{label}</span>
        {hint && <span style={{ fontSize: 15, lineHeight: 1.35, color: 'var(--color-text-secondary)' }}>{hint}</span>}
      </span>
      {row && <Icon name="chevron-right" size={20} style={{ color: 'var(--color-text-muted)' }} />}
    </a>
  );
}