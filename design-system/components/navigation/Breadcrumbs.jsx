import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function Breadcrumbs({ items = [] }) {
  return (
    <nav aria-label="Ruta"><ol className="hds-crumbs">
      {items.map((it, i) => (
        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {i > 0 && <Icon name="chevron-right" size={16} style={{ color: 'var(--color-text-muted)' }} />}
          {i === items.length - 1 ? <span aria-current="page">{it.label}</span> : <a href={it.href || '#'}>{it.label}</a>}
        </li>
      ))}
    </ol></nav>
  );
}