import React from 'react';
const T = { blue: 'var(--color-primary)', green: 'var(--green-500)', yellow: 'var(--yellow-400)' };
export function ProgressBar({ value = 0, label, showValue = true, tone = 'blue', size = 'md', indeterminate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'var(--font-sans)' }}>
      {(label || showValue) && <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 15 }}>
        <span style={{ fontWeight: 600 }}>{label}</span>{showValue && !indeterminate && <span style={{ fontFamily: 'var(--font-mono)' }}>{value}%</span>}</div>}
      <div className={'hds-progress' + (size === 'lg' ? ' hds-progress--lg' : '') + (indeterminate ? ' hds-progress--indeterminate' : '')} role="progressbar" aria-valuenow={indeterminate ? undefined : value} aria-valuemin="0" aria-valuemax="100" aria-label={label}>
        <div className="hds-progress__bar" style={{ width: indeterminate ? undefined : value + '%', background: T[tone] }} />
      </div>
    </div>
  );
}