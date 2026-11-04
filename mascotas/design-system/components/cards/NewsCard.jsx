import React from 'react';
export function NewsCard({ image, category, title, excerpt, date, href = '#', layout = 'vertical' }) {
  const h = layout === 'horizontal';
  return (
    <a href={href} className="hds-card hds-card--interactive" style={{ flexDirection: h ? 'row' : 'column' }}>
      <div className="hds-card__media" style={{ backgroundImage: image ? 'url(' + image + ')' : undefined, aspectRatio: h ? '1/1' : '16/10', width: h ? 140 : 'auto', flex: 'none' }} />
      <div className="hds-card__pad" style={{ gap: 8 }}>
        {category && <span className="hds-overline">{category}</span>}
        <span style={{ fontWeight: 700, fontSize: 20, lineHeight: 1.3, color: 'var(--color-text)', textWrap: 'pretty' }}>{title}</span>
        {excerpt && <span style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--color-text-secondary)' }}>{excerpt}</span>}
        {date && <span style={{ fontSize: 14, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{date}</span>}
      </div>
    </a>
  );
}