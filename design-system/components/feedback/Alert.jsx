import React from 'react';
import { Icon } from '../core/Icon.jsx';
const ICON = { success: 'check', error: 'x', warning: 'triangle-alert', info: 'info' };
export function Alert({ tone = 'info', title, children, action, onClose }) {
  return (
    <div className={'hds-alert hds-alert--' + tone} role={tone === 'error' || tone === 'warning' ? 'alert' : 'status'}>
      <span className="hds-alert__icon"><Icon name={ICON[tone]} size={18} /></span>
      <div className="hds-alert__body">
        {title && <span className="hds-alert__title">{title}</span>}
        {children && <span style={{ color: 'var(--color-text)' }}>{children}</span>}
        {action && <span style={{ marginTop: 6 }}>{action}</span>}
      </div>
      {onClose && <button type="button" aria-label="Cerrar" onClick={onClose} style={{ border: 0, background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', width: 32, height: 32, display: 'grid', placeItems: 'center' }}><Icon name="x" size={18} /></button>}
    </div>
  );
}