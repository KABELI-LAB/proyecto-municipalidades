import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function HandoffCard({ name, role, eta, caseId, state = 'waiting' }) {
  const initials = name.split(' ').map((s) => s[0]).slice(0, 2).join('');
  return (
    <div style={{ border: '1px solid var(--green-200)', background: 'var(--color-surface)', borderRadius: 18, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, fontFamily: 'var(--font-sans)', maxWidth: 340 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ position: 'relative', width: 48, height: 48, borderRadius: '50%', background: 'var(--green-100)', color: 'var(--green-800)', display: 'grid', placeItems: 'center', font: '700 17px/1 var(--font-sans)', flex: 'none' }}>{initials}
          <span style={{ position: 'absolute', right: 0, bottom: 0, width: 14, height: 14, borderRadius: '50%', border: '2px solid #fff', background: state === 'connected' ? 'var(--green-500)' : 'var(--yellow-400)' }} /></span>
        <div><div style={{ fontWeight: 700, fontSize: 17 }}>{name}</div><div style={{ fontSize: 15, color: 'var(--color-text-secondary)' }}>{role}</div></div>
      </div>
      <div style={{ fontSize: 15, lineHeight: 1.45, color: 'var(--color-text)' }}>{state === 'connected' ? 'Está revisando tu conversación. No necesitas repetir nada.' : 'Te atenderá ' + (eta ? 'en ' + eta : 'pronto') + '. Le pasamos tu conversación completa.'}</div>
      {caseId && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, paddingTop: 10, borderTop: '1px solid var(--color-border)' }}><span style={{ color: 'var(--color-text-secondary)' }}>N° de atención</span><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{caseId}</span></div>}
    </div>
  );
}