import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function FileUpload({ label, hint = 'PDF, JPG o PNG. Máximo 10 MB.', files = [], onRemove }) {
  return (
    <div className="hds-field">
      <span className="hds-label">{label}</span>
      <label className="hds-upload">
        <input type="file" className="hds-visually-hidden" />
        <Icon name="upload" size={28} style={{ color: 'var(--color-primary)' }} />
        <span><strong>Elige un archivo</strong> o arrástralo aquí</span>
        <span style={{ fontSize: 15 }}>{hint}</span>
      </label>
      {files.map((f) => (
        <div key={f.name} className="hds-filechip">
          <Icon name={f.status === 'error' ? 'circle-alert' : f.status === 'uploading' ? 'loader-circle' : 'circle-check'} size={20}
            style={{ color: f.status === 'error' ? 'var(--color-error)' : f.status === 'uploading' ? 'var(--color-text-muted)' : 'var(--color-success)' }} />
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{f.name}</span>
          {f.size && <span style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 14 }}>{f.size}</span>}
          <button type="button" aria-label={'Quitar ' + f.name} onClick={() => onRemove && onRemove(f.name)} style={{ border: 0, background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', width: 36, height: 36, display: 'grid', placeItems: 'center' }}><Icon name="x" size={18} /></button>
        </div>
      ))}
    </div>
  );
}