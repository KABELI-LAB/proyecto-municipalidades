import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { StatusBadge } from '../feedback/StatusBadge.jsx';
const C = { operativo: 'var(--green-500)', intermitente: 'var(--yellow-400)', suspendido: 'var(--red-600)', finalizado: 'var(--neutral-400)' };
export function ServiceStatus({ name, status, detail, updated, icon = 'circle' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 4px', borderBottom: '1px solid var(--color-border)', fontFamily: 'var(--font-sans)' }}>
      <span style={{ width: 12, height: 12, borderRadius: '50%', flex: 'none', background: C[status], boxShadow: '0 0 0 4px color-mix(in srgb, ' + C[status] + ' 22%, transparent)' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 17 }}>{name}</div>
        {detail && <div style={{ fontSize: 15, color: 'var(--color-text-secondary)', marginTop: 2 }}>{detail}</div>}
      </div>
      {updated && <span style={{ font: '400 13px/1 var(--font-mono)', color: 'var(--color-text-muted)' }}>{updated}</span>}
      <StatusBadge status={status} size="sm" />
    </div>
  );
}