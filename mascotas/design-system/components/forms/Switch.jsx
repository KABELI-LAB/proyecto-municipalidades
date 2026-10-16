import React from 'react';
export function Switch({ label, checked, defaultChecked, disabled, onChange }) {
  return (
    <label className="hds-switch">
      <span>{label}</span>
      <input type="checkbox" role="switch" checked={checked} defaultChecked={defaultChecked} disabled={disabled} onChange={onChange} />
    </label>
  );
}