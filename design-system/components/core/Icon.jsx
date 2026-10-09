import React from 'react';
import { ICONOS } from './icons.js';
/*
 * Adaptación del proyecto: el original descargaba cada SVG desde unpkg en tiempo
 * de ejecución. Aquí se usa lucide-react (mismo set y nombres) con un registro
 * acotado de íconos (icons.js), empaquetado con el sitio: sin CDN externo.
 */
export function Icon({ name, size = 20, label, style, className = '', strokeWidth = 2 }) {
  const Svg = ICONOS[name];
  if (!Svg && import.meta.env && import.meta.env.DEV) {
    console.warn(`[design-system] Ícono "${name}" no registrado: agrégalo en design-system/components/core/icons.js`);
  }
  return (
    <span role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}
      className={'hds-icon ' + className} style={{ width: size, height: size, ...style }}>
      {Svg ? <Svg size={size} strokeWidth={strokeWidth} aria-hidden="true" /> : null}
    </span>
  );
}
