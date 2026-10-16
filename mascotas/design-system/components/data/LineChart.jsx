import React from 'react';
export function LineChart({ labels = [], series = [], height = 220, format = (v) => v.toLocaleString('es-CL') }) {
  const W = 600, H = height, P = { l: 16, r: 96, t: 12, b: 28 };
  const all = series.flatMap((s) => s.values); const max = Math.max(...all) * 1.1, min = 0;
  const x = (i) => P.l + (i * (W - P.l - P.r)) / Math.max(labels.length - 1, 1);
  const y = (v) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b);
  const cols = ['var(--data-1)', 'var(--data-2)', 'var(--data-3)', 'var(--data-4)'];
  const ends = series.map((s, si) => ({ si, y: y(s.values[s.values.length - 1]) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 40) ends[i].y = ends[i - 1].y + 40;
  const ly = {}; ends.forEach((e) => { ly[e.si] = e.y; });
  return (
    <svg viewBox={'0 0 ' + W + ' ' + H} style={{ width: '100%', height: 'auto', display: 'block', fontFamily: 'var(--font-sans)' }} role="img" aria-label={series.map((s) => s.name).join(', ')}>
      {[0, .25, .5, .75, 1].map((t) => <line key={t} x1={P.l} x2={W - P.r} y1={P.t + t * (H - P.t - P.b)} y2={P.t + t * (H - P.t - P.b)} stroke="var(--color-border)" strokeWidth="1" />)}
      {labels.map((l, i) => <text key={l} x={x(i)} y={H - 8} fontSize="13" textAnchor="middle" fill="var(--color-text-secondary)">{l}</text>)}
      {series.map((s, si) => { const c = s.color || cols[si % 4]; const last = s.values.length - 1; return (
        <g key={s.name}>
          <polyline points={s.values.map((v, i) => x(i) + ',' + y(v)).join(' ')} fill="none" stroke={c} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={x(last)} cy={y(s.values[last])} r="5" fill={c} />
          <text x={x(last) + 10} y={ly[si] + 4} fontSize="15" fontWeight="700" fill="var(--color-text)">{format(s.values[last])}</text>
          <text x={x(last) + 10} y={ly[si] + 20} fontSize="13" fill="var(--color-text-secondary)">{s.name}</text>
        </g>); })}
    </svg>
  );
}