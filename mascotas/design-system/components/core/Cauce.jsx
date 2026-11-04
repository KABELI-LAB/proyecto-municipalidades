import React from 'react';
const PATHS = {
  rise: (y) => 'M-40 ' + (y + 150) + ' C 260 ' + (y + 150) + ', 470 ' + (y + 20) + ', 760 ' + y + ' S 1120 ' + (y - 14) + ', 1240 ' + (y - 14),
  flat: (y) => 'M-40 ' + (y + 40) + ' C 200 ' + (y + 40) + ', 360 ' + (y - 30) + ', 600 ' + (y - 30) + ' S 1000 ' + (y + 40) + ', 1240 ' + (y + 20),
};
export function Cauce({ bands = 3, colors = ['var(--blue-500)', 'var(--blue-600)', 'var(--blue-700)'], thickness = 18, gap = 70, shape = 'rise', style }) {
  const start = shape === 'rise' ? 120 : 160;
  return (
    <svg viewBox="0 0 1200 400" preserveAspectRatio="none" aria-hidden="true" style={{ display: 'block', width: '100%', height: '100%', ...style }}>
      {Array.from({ length: bands }).map((_, i) => (
        <path key={i} d={PATHS[shape](start + i * gap)} fill="none" stroke={colors[i % colors.length]} strokeWidth={thickness} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}