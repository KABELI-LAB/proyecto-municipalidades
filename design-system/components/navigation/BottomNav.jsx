import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function BottomNav({ items = [], value, onChange }) {
  return (
    <nav className="hds-bottomnav" aria-label="Navegación principal">
      {items.map((it) => (
        <button key={it.id} type="button" className="hds-bottomnav__item" aria-current={value === it.id ? 'page' : undefined} onClick={() => onChange && onChange(it.id)}>
          <span className="hds-bottomnav__pill" style={{ position: 'relative' }}><Icon name={it.icon} size={22} />
            {it.badge ? <span style={{ position: 'absolute', top: -2, right: 8, minWidth: 18, height: 18, borderRadius: 9, background: 'var(--color-error)', color: '#fff', font: '700 11px/18px var(--font-mono)', textAlign: 'center', padding: '0 4px' }}>{it.badge}</span> : null}
          </span>
          {it.label}
        </button>
      ))}
    </nav>
  );
}