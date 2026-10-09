import React from 'react';
export function Checkbox({ label, description, checked, defaultChecked, disabled, onChange, name }) {
  return (
    <label className="hds-check">
      <input type="checkbox" name={name} checked={checked} defaultChecked={defaultChecked} disabled={disabled} onChange={onChange} />
      <span className="hds-check__text">{label}{description && <span className="hds-check__desc">{description}</span>}</span>
    </label>
  );
}