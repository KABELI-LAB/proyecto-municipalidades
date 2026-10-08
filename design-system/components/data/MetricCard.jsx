import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function MetricCard({ label, value, unit, delta, trend = 'up', upIsGood = true, icon, progress, caption }) {
  const good = trend === 'flat' ? null : (trend === 'up') === upIsGood;
  const col = good == null ? 'var(--color-text-secondary)' : good ? 'var(--color-success)' : 'var(--color-error)';
  return (
    <div className="hds-metric">
      <span className="hds-metric__label">{icon && <Icon name={icon} size={18} />}{label}</span>
      <span className="hds-metric__value">{value}{unit && <span className="hds-metric__unit">{unit}</span>}</span>
      {progress != null && <div className="hds-progress" style={{ margin: '4px 0' }}><div className="hds-progress__bar" style={{ width: progress + '%' }} /></div>}
      <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {delta && <span className="hds-metric__delta" style={{ color: col }}><Icon name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'minus'} size={16} />{delta}</span>}
        {caption && <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>{caption}</span>}
      </span>
    </div>
  );
}