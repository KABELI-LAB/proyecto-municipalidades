import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function ChatMessage({ from = 'assistant', children, time, name, status, attachment }) {
  return (
    <div className={'hds-msg hds-msg--' + from}>
      {(from === 'staff' || (from === 'assistant' && name)) && <span className="hds-msg__meta"><span className="hds-msg__who">{name || 'Asistente Hualañé'}</span>{from === 'staff' && <span>· Funcionario municipal</span>}</span>}
      {children && <div className="hds-msg__bubble">{children}</div>}
      {attachment}
      {time && from !== 'system' && <span className="hds-msg__meta">{time}{from === 'citizen' && status && <Icon name={status === 'read' ? 'check-check' : 'check'} size={14} style={{ color: status === 'read' ? 'var(--blue-500)' : undefined }} />}</span>}
    </div>
  );
}