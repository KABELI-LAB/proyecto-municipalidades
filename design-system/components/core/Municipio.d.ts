import * as React from 'react';

/** Identificador de cada tema del design system. Hualañé es el predeterminado. */
export type MunicipioId = 'hualane' | 'curepto' | 'vichuquen';

export interface Municipio {
  id: MunicipioId;
  /** Nombre corto, para textos: "Hualañé" */
  nombre: string;
  /** "Ilustre Municipalidad de Hualañé" */
  nombreLargo: string;
}

export declare const MUNICIPIOS: Record<MunicipioId, Municipio>;
export declare const MUNICIPIO_PREDETERMINADO: MunicipioId;
export declare function esMunicipio(valor: unknown): valor is MunicipioId;

export interface MunicipioProviderProps {
  municipio?: MunicipioId;
  children?: React.ReactNode;
}

/** Elige el municipio activo. El anfitrión también debe poner `data-tema` en <html>. */
export declare function MunicipioProvider(props: MunicipioProviderProps): React.JSX.Element;
/** Municipio activo (Hualañé si no hay provider). */
export declare function useMunicipio(): Municipio;
