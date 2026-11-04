import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function Sidebar({ groups = [], value, onChange, header, footer }) {
  return (
    <aside className="hds-sidebar" aria-label="Menú">
      {header}
      {groups.map((g, gi) => (
        <div key={gi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {g.title && <div className="hds-sidebar__group">{g.title}</div>}
          {g.items.map((it) => (
            <button key={it.id} type="button" className="hds-sidebar__item" aria-current={value === it.id ? 'page' : undefined} onClick={() => onChange && onChange(it.id)}>
              <Icon name={it.icon} size={20} /><span>{it.label}</span>{it.badge ? <span className="hds-sidebar__badge">{it.badge}</span> : null}
            </button>
          ))}
        </div>
      ))}
      <div style={{ marginTop: 'auto' }}>{footer}</div>
    </aside>
  );
}