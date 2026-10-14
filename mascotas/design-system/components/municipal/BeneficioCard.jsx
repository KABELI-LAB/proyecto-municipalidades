import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { StatusBadge } from '../feedback/StatusBadge.jsx';
export function BeneficioCard({ title, audience, requirements = [], deadline, daysLeft, amount, status = 'abierta', icon = 'gift', onApply }) {
  const urgent = status === 'abierta' && daysLeft != null && daysLeft <= 7;
  return (
    <article className="hds-card">
      <div style={{ background: 'var(--green-50)', padding: '18px 24px', display: 'flex', gap: 14, alignItems: 'center', borderBottom: '1px solid var(--green-100)' }}>
        <span className="hds-tile-icon" style={{ background: 'var(--green-700)', color: '#fff' }}><Icon name={icon} size={24} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 21, lineHeight: 1.25 }}>{title}</h3>
          {amount && <div style={{ font: '600 16px/1.3 var(--font-sans)', color: 'var(--green-800)', marginTop: 4 }}>{amount}</div>}
        </div>
        <StatusBadge status={status} size="sm" />
      </div>
      <div className="hds-card__pad" style={{ gap: 14 }}>
        <div><div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>¿A quién está dirigido?</div><div style={{ fontSize: 17, lineHeight: 1.5 }}>{audience}</div></div>
        {requirements.length > 0 && <div><div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Requisitos</div><ul className="hds-list">{requirements.map((r) => <li key={r}><Icon name="check" size={18} />{r}</li>)}</ul></div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
          {deadline && <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, flex: 1, minWidth: 160, fontWeight: 600, color: urgent ? 'var(--yellow-800)' : 'var(--color-text)' }}>
            <span style={{ display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: 8, background: urgent ? 'var(--yellow-300)' : 'var(--color-surface-muted)', color: urgent ? 'var(--blue-950)' : 'var(--color-text-secondary)' }}><Icon name="calendar-days" size={18} /></span>
            <span>Hasta el {deadline}{urgent ? ' · quedan ' + daysLeft + ' días' : ''}</span></span>}
          <button type="button" className="hds-btn hds-btn--primary" disabled={status !== 'abierta'} onClick={onApply}>Postular</button>
        </div>
      </div>
    </article>
  );
}