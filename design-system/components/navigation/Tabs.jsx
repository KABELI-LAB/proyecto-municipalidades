import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function Tabs({ items = [], value, onChange }) {
  const [v, setV] = React.useState(value ?? (items[0] && items[0].id));
  const cur = value ?? v;
  return (
    <div className="hds-tabs" role="tablist">
      {items.map((t) => (
        <button key={t.id} role="tab" type="button" className="hds-tab" aria-selected={cur === t.id} onClick={() => { setV(t.id); onChange && onChange(t.id); }}>
          {t.icon && <Icon name={t.icon} size={18} />}{t.label}{t.count != null && <span className="hds-tab__count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}