import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function EmptyState({ icon = 'search', title, children, action }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12, padding: '40px 24px', fontFamily: 'var(--font-sans)' }}>
      <span style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--color-surface-muted)', display: 'grid', placeItems: 'center', color: 'var(--color-text-secondary)' }}><Icon name={icon} size={32} /></span>
      <h3 style={{ margin: 0, fontSize: 22, lineHeight: 1.3 }}>{title}</h3>
      {children && <p style={{ margin: 0, maxWidth: 420, color: 'var(--color-text-secondary)', fontSize: 17, lineHeight: 1.5 }}>{children}</p>}
      {action}
    </div>
  );
}