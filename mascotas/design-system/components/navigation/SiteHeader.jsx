import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { Logo } from '../core/Logo.jsx';
export function SiteHeader({ items = [], assetBase = 'assets', logoVariant = 'citizen', onSearch, onAccessibility, showGovStrip = true }) {
  return (
    <header className="hds-header">
      {showGovStrip && <div className="hds-header__gov"><div className="hds-header__gov-in">
        <span>Sitio oficial de la Ilustre Municipalidad de Hualañé · Región del Maule</span>
        <span style={{ display: 'flex', gap: 20 }}><a href="#">Mesa central 75 2 481 100</a><a href="#">Transparencia</a></span>
      </div></div>}
      <div className="hds-header__in">
        <a href="#" aria-label="Inicio, Municipalidad de Hualañé" style={{ display: 'flex' }}><Logo variant={logoVariant} height={logoVariant === 'citizen' ? 46 : 52} base={assetBase} /></a>
        <nav className="hds-header__nav" aria-label="Principal">
          {items.map((it) => <a key={it.label} href={it.href || '#'} className="hds-header__link" aria-current={it.current ? 'page' : undefined}>{it.label}</a>)}
        </nav>
        <div style={{ display: 'flex', gap: 4 }}>
          <button type="button" className="hds-btn hds-btn--ghost hds-iconbtn" aria-label="Accesibilidad" onClick={onAccessibility}><Icon name="accessibility" size={22} /></button>
          <button type="button" className="hds-btn hds-btn--tertiary" onClick={onSearch}><Icon name="search" size={20} /><span>Buscar</span></button>
        </div>
      </div>
    </header>
  );
}