import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function Pagination({ page = 1, total = 1, onChange }) {
  const go = (p) => onChange && onChange(Math.min(total, Math.max(1, p)));
  const pages = [];
  for (let i = 1; i <= total; i++) { if (i === 1 || i === total || Math.abs(i - page) <= 1) pages.push(i); else if (pages[pages.length - 1] !== '…') pages.push('…'); }
  return (
    <nav aria-label="Paginación" className="hds-pager">
      <button type="button" className="hds-pager__btn" disabled={page <= 1} onClick={() => go(page - 1)} style={{ fontFamily: 'var(--font-sans)' }}><Icon name="chevron-left" size={18} />Anterior</button>
      {pages.map((p, i) => p === '…' ? <span key={'e' + i} style={{ padding: '0 6px', color: 'var(--color-text-muted)' }}>…</span> :
        <button key={p} type="button" className="hds-pager__btn" aria-current={p === page ? 'page' : undefined} onClick={() => go(p)}>{p}</button>)}
      <button type="button" className="hds-pager__btn" disabled={page >= total} onClick={() => go(page + 1)} style={{ fontFamily: 'var(--font-sans)' }}>Siguiente<Icon name="chevron-right" size={18} /></button>
    </nav>
  );
}