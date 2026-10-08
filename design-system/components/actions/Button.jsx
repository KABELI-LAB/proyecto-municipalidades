import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function Button({ variant = 'primary', size = 'md', iconLeft, iconRight, loading, disabled, block, href, type = 'button', onClick, children, style }) {
  const cls = ['hds-btn', 'hds-btn--' + variant, size !== 'md' && 'hds-btn--' + size, block && 'hds-btn--block'].filter(Boolean).join(' ');
  const is = size === 'lg' ? 22 : size === 'sm' ? 18 : 20;
  const inner = <>
    {loading ? <span className="hds-spinner" aria-hidden="true" /> : iconLeft && <Icon name={iconLeft} size={is} />}
    <span>{children}</span>
    {!loading && iconRight && <Icon name={iconRight} size={is} />}
  </>;
  if (href) return <a className={cls} href={href} aria-disabled={disabled || undefined} style={style}>{inner}</a>;
  return <button type={type} className={cls} disabled={disabled} aria-busy={loading || undefined} onClick={onClick} style={style}>{inner}</button>;
}