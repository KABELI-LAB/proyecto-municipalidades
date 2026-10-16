import React from 'react';
import { Icon } from '../core/Icon.jsx';
let n = 0;
export function Select({ label, options = [], hint, error, placeholder, value, defaultValue, disabled, onChange }) {
  const fid = React.useMemo(() => 'hds-sel-' + (++n), []);
  return (
    <div className="hds-field">
      <label className="hds-label" htmlFor={fid}>{label}</label>
      {hint && <span className="hds-hint">{hint}</span>}
      <div className="hds-control">
        <select id={fid} className="hds-input hds-input--select" value={value} defaultValue={value === undefined ? (defaultValue ?? (placeholder ? '' : undefined)) : undefined} disabled={disabled} onChange={onChange} aria-invalid={error ? true : undefined}>
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((o) => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <Icon name="chevron-down" size={20} className="hds-control__chev" />
      </div>
      {error && <span className="hds-error-msg"><Icon name="circle-alert" size={18} />{error}</span>}
    </div>
  );
}