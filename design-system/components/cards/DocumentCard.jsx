import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function DocumentCard({ title, type = 'PDF', size, date, href = '#' }) {
  return (
    <a href={href} className="hds-card hds-card--interactive" style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: '16px 18px' }}>
      <span className="hds-tile-icon hds-tile-icon--red" style={{ flexDirection: 'column', gap: 0 }}><Icon name="file-text" size={22} /></span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.3, color: 'var(--color-text)' }}>{title}</span>
        <span style={{ fontSize: 14, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>{[type, size, date].filter(Boolean).join(' · ')}</span>
      </span>
      <span className="hds-btn hds-btn--ghost hds-iconbtn" aria-hidden="true"><Icon name="download" size={22} /></span>
    </a>
  );
}