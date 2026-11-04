import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function SearchBar({ placeholder = 'Busca un trámite o servicio', size = 'md', value, onChange, onSubmit, voice = true, buttonLabel = 'Buscar' }) {
  const ref = React.useRef(null);
  return (
    <form role="search" className={'hds-search' + (size === 'lg' ? ' hds-search--lg' : '')} onSubmit={(e) => { e.preventDefault(); onSubmit && onSubmit(ref.current.value); }}>
      <Icon name="search" size={size === 'lg' ? 26 : 22} style={{ color: 'var(--color-text-secondary)' }} />
      <input ref={ref} type="search" aria-label={placeholder} placeholder={placeholder} value={value} onChange={onChange} />
      {voice && <button type="button" className="hds-btn hds-btn--ghost hds-iconbtn hds-iconbtn--round" aria-label="Buscar por voz"><Icon name="mic" size={22} /></button>}
      <button type="submit" className={'hds-btn hds-btn--primary' + (size === 'lg' ? ' hds-btn--lg' : '')} style={{ borderRadius: size === 'lg' ? 20 : 14 }}>{buttonLabel}</button>
    </form>
  );
}