import React from 'react';
export function DonutChart({ data = [], size = 180, centerLabel, centerValue }) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1; const r = 70, c = 2 * Math.PI * r; let off = 0;
  const cols = ['var(--data-1)', 'var(--data-2)', 'var(--data-3)', 'var(--data-4)', 'var(--data-5)'];
  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', fontFamily: 'var(--font-sans)' }}>
      <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
        <svg viewBox="0 0 180 180" width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
          <circle cx="90" cy="90" r={r} fill="none" stroke="var(--color-surface-muted)" strokeWidth="22" />
          {data.map((d, i) => { const len = (d.value / total) * c; const el = <circle key={d.label} cx="90" cy="90" r={r} fill="none" stroke={d.color || cols[i % 5]} strokeWidth="22" strokeDasharray={Math.max(len - 3, 0) + ' ' + c} strokeDashoffset={-off} />; off += len; return el; })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeContent: 'center', textAlign: 'center' }}>
          <span style={{ font: '500 ' + Math.round(size / 8) + 'px/1 var(--font-mono)', letterSpacing: '-.02em' }}>{centerValue ?? total.toLocaleString('es-CL')}</span>
          {centerLabel && <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>{centerLabel}</span>}
        </div>
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map((d, i) => <li key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: d.color || cols[i % 5] }} /><span style={{ flex: 1 }}>{d.label}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{Math.round((d.value / total) * 100)}%</span></li>)}
      </ul>
    </div>
  );
}