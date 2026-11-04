import React, { createContext, useContext } from 'react';
/*
 * Municipio activo (tema). El design system tiene tres temas: Hualañé (predeterminado),
 * Curepto y Vichuquén. El sitio anfitrión elige uno con <MunicipioProvider> y pone
 * data-tema en <html> para los tokens; los componentes (Logo) y los módulos leen
 * el municipio con useMunicipio(). Sin provider, rige Hualañé.
 */
export const MUNICIPIOS = {
  hualane: { id: 'hualane', nombre: 'Hualañé', nombreLargo: 'Ilustre Municipalidad de Hualañé' },
  curepto: { id: 'curepto', nombre: 'Curepto', nombreLargo: 'Ilustre Municipalidad de Curepto' },
  vichuquen: { id: 'vichuquen', nombre: 'Vichuquén', nombreLargo: 'Ilustre Municipalidad de Vichuquén' },
};
export const MUNICIPIO_PREDETERMINADO = 'hualane';

export function esMunicipio(valor) {
  return typeof valor === 'string' && Object.prototype.hasOwnProperty.call(MUNICIPIOS, valor);
}

const Contexto = createContext(MUNICIPIOS[MUNICIPIO_PREDETERMINADO]);

export function MunicipioProvider({ municipio = MUNICIPIO_PREDETERMINADO, children }) {
  const valor = MUNICIPIOS[municipio] || MUNICIPIOS[MUNICIPIO_PREDETERMINADO];
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useMunicipio() {
  return useContext(Contexto);
}
