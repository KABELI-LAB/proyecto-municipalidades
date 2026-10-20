import React from 'react';
export function Card({ variant = 'outline', interactive, href, padded = true, children, style, onClick }) {
  const cls = ['hds-card', variant !== 'outline' && 'hds-card--' + variant, (interactive || href) && 'hds-card--interactive'].filter(Boolean).join(' ');
  const body = padded ? <div className="hds-card__pad">{children}</div> : children;
  return href ? <a href={href} className={cls} style={style}>{body}</a> : <div className={cls} style={style} onClick={onClick}>{body}</div>;
}