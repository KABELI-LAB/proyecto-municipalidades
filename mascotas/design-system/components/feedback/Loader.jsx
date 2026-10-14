import React from 'react';
export function Loader({ kind = 'spinner', label = 'Cargando…', lines = 3 }) {
  if (kind === 'skeleton') return (
    <div aria-busy="true" aria-label={label} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: lines }).map((_, i) => <div key={i} style={{ height: i === 0 ? 22 : 14, width: i === 0 ? '55%' : i === lines - 1 ? '70%' : '100%', borderRadius: 6, background: 'linear-gradient(90deg,var(--neutral-100),var(--neutral-200),var(--neutral-100))', backgroundSize: '200% 100%' }} />)}
    </div>
  );
  return <div role="status" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-sans)', fontSize: 17, color: 'var(--color-text-secondary)' }}><span className="hds-spinner" style={{ width: 22, height: 22, color: 'var(--color-primary)' }} />{label}</div>;
}