import React from 'react';
/*
 * Adaptación del proyecto: por defecto los archivos se resuelven con
 * new URL(..., import.meta.url) para que Vite los empaquete. `base` sigue
 * disponible para servirlos desde otra carpeta pública.
 */
const archivo = (base, file) => (base ? base + '/logo/' + file : new URL(`../../assets/logo/${file}`, import.meta.url).href);
export function Logo({ variant = 'citizen', height = 48, inverse = false, base }) {
  if (variant === 'institutional') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: height * 0.28, fontFamily: 'var(--font-sans)' }}>
        <img src={archivo(base, 'escudo.png')} alt="Escudo de Hualañé" style={{ height, width: 'auto', display: 'block' }} />
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05, color: inverse ? '#fff' : 'var(--blue-700)' }}>
          <span style={{ fontSize: height * 0.2, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', opacity: inverse ? 0.85 : 1, color: inverse ? '#fff' : 'var(--neutral-600)' }}>Ilustre Municipalidad de</span>
          <span style={{ fontSize: height * 0.44, fontWeight: 800, letterSpacing: '-.01em' }}>Hualañé</span>
        </span>
      </span>
    );
  }
  if (inverse && variant === 'combined') return <img src={archivo(base, 'logo-vertical-white.png')} alt="Hualañé, Somos tod@s" style={{ height, display: 'block' }} />;
  const file = { citizen: 'wordmark-somos-todos.png', combined: 'logo-full-color.png', wordmark: 'wordmark.png', escudo: 'escudo.png', mark: 'digital-mark.svg' }[variant];
  const alt = variant === 'escudo' ? 'Escudo de Hualañé' : variant === 'citizen' || variant === 'combined' ? 'Hualañé, Somos tod@s' : 'Hualañé';
  return <img src={archivo(base, file)} alt={alt} style={{ height, width: 'auto', display: 'block', filter: inverse && variant !== 'mark' ? 'brightness(0) invert(1)' : undefined }} />;
}