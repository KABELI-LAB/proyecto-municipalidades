import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function Drawer({ open = true, side = 'right', title, children, footer, onClose }) {
  if (!open) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,21,51,.45)', zIndex: 50 }} onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <div className={'hds-drawer hds-drawer--' + side} role="dialog" aria-label={title}>
        {side === 'bottom' && <span style={{ width: 44, height: 5, borderRadius: 3, background: 'var(--neutral-300)', margin: '10px auto 0' }} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 20px 12px' }}>
          <h2 style={{ margin: 0, flex: 1, fontSize: 22 }}>{title}</h2>
          {onClose && <button type="button" className="hds-btn hds-btn--ghost hds-iconbtn hds-btn--sm" aria-label="Cerrar" onClick={onClose}><Icon name="x" size={20} /></button>}
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 20px' }}>{children}</div>
        {footer && <div style={{ padding: 20, borderTop: '1px solid var(--color-border)', display: 'flex', gap: 12 }}>{footer}</div>}
      </div>
    </div>
  );
}