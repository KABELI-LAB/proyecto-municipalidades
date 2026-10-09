import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function Timeline({ steps = [] }) {
  return (
    <ol className="hds-timeline">
      {steps.map((s, i) => (
        <li key={i} className={'hds-timeline__item hds-timeline__item--' + s.state} aria-current={s.state === 'current' ? 'step' : undefined}>
          <span className="hds-timeline__dot">{s.state === 'done' ? <Icon name="check" size={16} /> : i + 1}</span>
          <div>
            <div className="hds-timeline__title" style={{ color: s.state === 'pending' ? 'var(--color-text-secondary)' : 'var(--color-text)' }}>{s.title}</div>
            {s.meta && <div className="hds-timeline__meta">{s.meta}</div>}
            {s.detail && <div style={{ marginTop: 8 }}>{s.detail}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}