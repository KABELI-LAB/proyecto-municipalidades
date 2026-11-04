import React from 'react';
export function BarChart({ data = [], orientation = 'horizontal', format = (v) => v.toLocaleString('es-CL'), color = 'var(--data-1)', height = 220, max }) {
  const m = max || Math.max(...data.map((d) => d.value), 1);
  const anyHL = data.some((d) => d.highlight);
  const fill = (d) => (anyHL && !d.highlight ? 'var(--blue-200)' : color);
  if (orientation === 'vertical') return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height, fontFamily: 'var(--font-sans)', borderBottom: '2px solid var(--color-border-strong)', paddingTop: 24 }}>
      {data.map((d) => (
        <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
          <span style={{ font: '500 14px/1 var(--font-mono)', color: 'var(--color-text)' }}>{format(d.value)}</span>
          <div style={{ width: '100%', maxWidth: 56, height: (d.value / m) * 100 + '%', background: fill(d), borderRadius: '6px 6px 0 0', transition: 'height var(--duration-complex) var(--ease-flow)' }} />
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: -24, height: 18 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: 'var(--font-sans)' }}>
      {data.map((d) => (
        <div key={d.label} style={{ display: 'grid', gridTemplateColumns: 'minmax(90px,30%) 1fr auto', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 15, color: 'var(--color-text)', fontWeight: d.highlight ? 700 : 400 }}>{d.label}</span>
          <div style={{ height: 14, background: 'var(--color-surface-muted)', borderRadius: 7 }}><div style={{ width: (d.value / m) * 100 + '%', height: '100%', background: fill(d), borderRadius: 7 }} /></div>
          <span style={{ font: '500 15px/1 var(--font-mono)', minWidth: 48, textAlign: 'right' }}>{format(d.value)}</span>
        </div>
      ))}
    </div>
  );
}