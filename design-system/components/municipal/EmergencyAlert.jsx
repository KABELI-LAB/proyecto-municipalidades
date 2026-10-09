import React from 'react';
import { Icon } from '../core/Icon.jsx';
const LV = {
  preventiva: { bg: 'var(--green-700)', fg: '#fff', label: 'Alerta temprana preventiva', soft: 'var(--green-50)' },
  amarilla: { bg: 'var(--yellow-400)', fg: 'var(--blue-950)', label: 'Alerta amarilla', soft: 'var(--yellow-50)' },
  roja: { bg: 'var(--red-600)', fg: '#fff', label: 'Alerta roja', soft: 'var(--red-50)' },
};
export function EmergencyAlert({ level = 'amarilla', title, zone, message, time, actionLabel = 'Ver qué hacer', onAction, secondaryLabel, layout = 'card' }) {
  const l = LV[level];
  if (layout === 'banner') return (
    <div role="alert" style={{ background: l.bg, color: l.fg, fontFamily: 'var(--font-sans)' }}>
      <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <Icon name="siren" size={24} />
        <strong style={{ fontSize: 17, textTransform: 'uppercase', letterSpacing: '.06em' }}>{l.label}</strong>
        <span style={{ fontSize: 17, flex: 1, minWidth: 200 }}>{title} · {zone}</span>
        <span style={{ font: '500 15px/1 var(--font-mono)', opacity: .9 }}>{time}</span>
        <button type="button" onClick={onAction} className="hds-btn hds-btn--sm" style={{ background: l.fg, color: level === 'amarilla' ? '#fff' : 'var(--neutral-950)' }}>{actionLabel}</button>
      </div>
    </div>
  );
  return (
    <section role="alert" style={{ borderRadius: 'var(--radius-large)', overflow: 'hidden', border: '2px solid ' + l.bg, fontFamily: 'var(--font-sans)', background: 'var(--color-surface)' }}>
      <div style={{ background: l.bg, color: l.fg, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Icon name="siren" size={26} />
        <strong style={{ fontSize: 16, textTransform: 'uppercase', letterSpacing: '.08em', flex: 1 }}>{l.label}</strong>
        <span style={{ font: '500 15px/1 var(--font-mono)' }}>{time}</span>
      </div>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 24, lineHeight: 1.2 }}>{title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600 }}><Icon name="map-pin" size={18} />{zone}</div>
        <p style={{ margin: 0, fontSize: 18, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
          <button type="button" className={'hds-btn ' + (level === 'roja' ? 'hds-btn--danger' : 'hds-btn--primary')} onClick={onAction}>{actionLabel}<Icon name="arrow-right" size={20} /></button>
          {secondaryLabel && <button type="button" className="hds-btn hds-btn--secondary"><Icon name="phone" size={20} />{secondaryLabel}</button>}
        </div>
      </div>
    </section>
  );
}