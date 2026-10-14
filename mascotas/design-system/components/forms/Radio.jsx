import React from 'react';
export function Radio({ label, name, value, description, checked, defaultChecked, disabled, onChange }) {
  return (
    <label className="hds-check">
      <input type="radio" name={name} value={value} checked={checked} defaultChecked={defaultChecked} disabled={disabled} onChange={onChange} />
      <span className="hds-check__text">{label}{description && <span className="hds-check__desc">{description}</span>}</span>
    </label>
  );
}