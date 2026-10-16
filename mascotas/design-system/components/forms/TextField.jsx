import React from 'react';
import { Icon } from '../core/Icon.jsx';
let n = 0;
export function TextField({ label, hint, error, optional, type = 'text', multiline, icon, placeholder, value, defaultValue, disabled, onChange, id }) {
  const fid = React.useMemo(() => id || 'hds-tf-' + (++n), [id]);
  const desc = [hint && fid + '-h', error && fid + '-e'].filter(Boolean).join(' ') || undefined;
  const p = { id: fid, className: 'hds-input' + (icon ? ' hds-input--icon' : ''), placeholder, value, defaultValue, disabled, onChange, 'aria-invalid': error ? true : undefined, 'aria-describedby': desc };
  return (
    <div className="hds-field">
      <label className="hds-label" htmlFor={fid}>{label}{optional && <span className="hds-label__opt"> (opcional)</span>}</label>
      {hint && <span className="hds-hint" id={fid + '-h'}>{hint}</span>}
      <div className="hds-control">
        {icon && <Icon name={icon} size={20} className="hds-control__icon" />}
        {multiline ? <textarea {...p} /> : <input type={type} {...p} />}
      </div>
      {error && <span className="hds-error-msg" id={fid + '-e'}><Icon name="circle-alert" size={18} style={{ marginTop: 1 }} />{error}</span>}
    </div>
  );
}