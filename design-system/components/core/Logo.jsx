import React from 'react';
import { useMunicipio } from './Municipio.jsx';
/*
 * Logotipo oficial del municipio activo (useMunicipio) o del indicado en `municipio`.
 * Adaptación del proyecto: por defecto los archivos se resuelven con
 * new URL(..., import.meta.url) para que Vite los empaquete. `base` sigue
 * disponible para servirlos desde otra carpeta pública.
 *
 * Las variantes son las de Hualañé; cada municipio las traduce a sus archivos:
 * - Curepto: `escudo` y `mark` = escudo; el resto = logotipo completo.
 * - Vichuquén: `horizontal`, `vertical`, `escudo`, `avatar`; `citizen`, `combined`,
 *   `wordmark` e `institutional` = horizontal; `mark` = escudo.
 * `inverse` usa la versión blanca.
 */
const archivo = (base, file) => (base ? base + '/logo/' + file : new URL(`../../assets/logo/${file}`, import.meta.url).href);

function LogoHualane({ variant, height, inverse, base }) {
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
  const v = { horizontal: 'citizen', vertical: 'combined', avatar: 'escudo' }[variant] || variant;
  const file = { citizen: 'wordmark-somos-todos.png', combined: 'logo-full-color.png', wordmark: 'wordmark.png', escudo: 'escudo.png', mark: 'digital-mark.svg' }[v] || 'wordmark-somos-todos.png';
  const alt = v === 'escudo' ? 'Escudo de Hualañé' : v === 'citizen' || v === 'combined' ? 'Hualañé, Somos tod@s' : 'Hualañé';
  return <img src={archivo(base, file)} alt={alt} style={{ height, width: 'auto', display: 'block', filter: inverse && v !== 'mark' ? 'brightness(0) invert(1)' : undefined }} />;
}

function LogoCurepto({ variant, height, inverse, base }) {
  const soloEscudo = variant === 'escudo' || variant === 'mark' || variant === 'avatar';
  const tinta = inverse ? 'blanco' : 'azul-noche';
  const file = `curepto-${soloEscudo ? 'escudo' : 'logo'}-${tinta}.png`;
  const alt = soloEscudo ? 'Escudo de Curepto' : 'Municipalidad de Curepto';
  return <img src={archivo(base, file)} alt={alt} style={{ height, width: 'auto', display: 'block' }} />;
}

const VARIANTE_VICHUQUEN = { horizontal: 'horizontal', citizen: 'horizontal', combined: 'horizontal', wordmark: 'horizontal', institutional: 'horizontal', vertical: 'vertical', escudo: 'escudo', mark: 'escudo', avatar: 'avatar' };
function LogoVichuquen({ variant, height, inverse, base }) {
  const v = VARIANTE_VICHUQUEN[variant] || 'horizontal';
  const file = 'vichuquen-' + (v === 'avatar' ? 'avatar-escudo.png' : v === 'escudo' ? `escudo-${inverse ? 'white' : 'color'}.png` : `logo-${v}-${inverse ? 'white' : 'color'}.png`);
  const alt = v === 'escudo' || v === 'avatar' ? 'Escudo de Vichuquén' : 'Ilustre Municipalidad de Vichuquén, Avanzando juntos';
  return <img src={archivo(base, file)} alt={alt} style={{ height, width: 'auto', display: 'block' }} />;
}

const POR_MUNICIPIO = { hualane: LogoHualane, curepto: LogoCurepto, vichuquen: LogoVichuquen };

export function Logo({ variant = 'citizen', height = 48, inverse = false, tone, municipio, base }) {
  const activo = useMunicipio();
  const Componente = POR_MUNICIPIO[municipio || activo.id] || LogoHualane;
  return <Componente variant={variant} height={height} inverse={tone ? tone === 'white' : inverse} base={base} />;
}
