import React from 'react';
import { Icon } from '../core/Icon.jsx';
const REG = { open: ['Inscríbete', 'primary'], free: ['Entrada liberada', null], full: ['Cupos agotados', null], none: [null, null] };
export function EventCard({ day, month, title, place, time, category, registration = 'open', image, onRegister }) {
  const [cta, v] = REG[registration];
  return (
    <div className="hds-card">
      {image && <div className="hds-card__media" style={{ backgroundImage: 'url(' + image + ')', aspectRatio: '16/8' }} />}
      <div className="hds-card__pad" style={{ flexDirection: 'row', gap: 18 }}>
        <div style={{ flex: 'none', width: 64, textAlign: 'center', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--color-border)', alignSelf: 'flex-start' }}>
          <div style={{ background: 'var(--color-secondary)', color: '#fff', font: '700 12px/1 var(--font-sans)', letterSpacing: '.1em', padding: '6px 0', textTransform: 'uppercase' }}>{month}</div>
          <div style={{ font: '500 30px/1 var(--font-mono)', padding: '10px 0 8px', color: 'var(--color-text)' }}>{day}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0, flex: 1 }}>
          {category && <span className="hds-overline">{category}</span>}
          <span style={{ fontWeight: 700, fontSize: 20, lineHeight: 1.3 }}>{title}</span>
          <span style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 16, color: 'var(--color-text-secondary)' }}><Icon name="map-pin" size={17} />{place}</span>
          {time && <span style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 16, color: 'var(--color-text-secondary)' }}><Icon name="clock" size={17} />{time}</span>}
          {cta && (v ? <button type="button" className="hds-btn hds-btn--secondary hds-btn--sm" style={{ alignSelf: 'flex-start', marginTop: 4 }} onClick={onRegister}>{cta}</button>
            : <span className={'hds-badge ' + (registration === 'full' ? '' : 'hds-badge--green')} style={{ alignSelf: 'flex-start', marginTop: 4 }}>{cta}</span>)}
        </div>
      </div>
    </div>
  );
}