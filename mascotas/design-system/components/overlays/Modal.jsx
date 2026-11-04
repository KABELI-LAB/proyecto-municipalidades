import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function Modal({ open = true, title, children, footer, onClose, inline, icon, iconTone = 'blue' }) {
  if (!open) return null;
  return (
    <div className={'hds-scrim' + (inline ? ' hds-scrim--inline' : '')} onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <div className="hds-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="hds-modal__head">
          {icon && <span className={'hds-tile-icon hds-tile-icon--' + iconTone}><Icon name={icon} size={24} /></span>}
          <h2 className="hds-modal__title" style={{ paddingTop: icon ? 10 : 0 }}>{title}</h2>
          {onClose && <button type="button" className="hds-btn hds-btn--ghost hds-iconbtn hds-btn--sm" aria-label="Cerrar" onClick={onClose}><Icon name="x" size={20} /></button>}
        </div>
        <div className="hds-modal__body">{children}</div>
        {footer && <div className="hds-modal__foot">{footer}</div>}
      </div>
    </div>
  );
}