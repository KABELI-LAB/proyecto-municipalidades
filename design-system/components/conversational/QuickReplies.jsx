import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function QuickReplies({ options = [], onSelect, selected }) {
  return (
    <div className="hds-chips" role="group" aria-label="Respuestas sugeridas">
      {options.map((o) => { const l = typeof o === 'string' ? o : o.label; const ic = typeof o === 'string' ? null : o.icon; return (
        <button key={l} type="button" className="hds-chip" aria-pressed={selected === l ? true : undefined} onClick={() => onSelect && onSelect(l)}>{ic && <Icon name={ic} size={18} />}{l}</button>); })}
    </div>
  );
}