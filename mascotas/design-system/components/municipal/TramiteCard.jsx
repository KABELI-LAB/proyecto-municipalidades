import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { StatusBadge } from '../feedback/StatusBadge.jsx';
export function TramiteCard({ title, description, icon = 'file-text', category, requirements = [], cost, duration, modality, status = 'operativo', cta = 'Iniciar trámite', onAction, compact }) {
  return (
    <article className="hds-card"><div className="hds-card__pad" style={{ gap: 14 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <span className="hds-tile-icon hds-tile-icon--blue"><Icon name={icon} size={24} /></span>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            {category ? <span className="hds-overline">{category}</span> : <span />}
            <StatusBadge status={status} size="sm" />
          </div>
          <h3 style={{ margin: 0, fontSize: 21, lineHeight: 1.25 }}>{title}</h3>
        </div>
      </div>
      {description && <p style={{ margin: 0, fontSize: 17, lineHeight: 1.5, color: 'var(--color-text-secondary)' }}>{description}</p>}
      {!compact && requirements.length > 0 && <div>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Necesitas</div>
        <ul className="hds-list">{requirements.map((r) => <li key={r}><Icon name="check" size={18} />{r}</li>)}</ul>
      </div>}
      <dl className="hds-facts">
        {cost && <div><dt><Icon name="wallet" size={14} />Costo</dt><dd>{cost}</dd></div>}
        {duration && <div><dt><Icon name="clock" size={14} />Demora</dt><dd>{duration}</dd></div>}
        {modality && <div><dt><Icon name="laptop" size={14} />Modalidad</dt><dd>{modality}</dd></div>}
      </dl>
      <button type="button" className="hds-btn hds-btn--primary" disabled={status === 'suspendido' || status === 'finalizado'} onClick={onAction} style={{ alignSelf: 'flex-start' }}>{cta}<Icon name="arrow-right" size={20} /></button>
    </div></article>
  );
}