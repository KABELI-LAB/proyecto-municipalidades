/**
 * Textos versionados. El consentimiento se guarda con su versión y el hash del
 * texto exacto que la persona aceptó: si cambias el texto, sube la versión.
 *
 * BORRADOR: requiere revisión jurídica de la Municipalidad (Ley 21.719).
 */
export const CONSENTIMIENTO = {
  version: '2026-10-borrador-1',
  texto: [
    'Autorizo a la Municipalidad de Hualañé a guardar los datos de mi hogar para darme ayuda más rápido en una emergencia y para entregarme los beneficios de la Tarjeta Hogar Preparado.',
    'Los datos de salud y situaciones especiales son opcionales y solo se usan para priorizar la ayuda. Nunca cambian mis beneficios.',
    'Mis datos no se venden ni se comparten con comercios. Los aliados solo ven si mi tarjeta está vigente.',
    'Puedo pedir que los corrijan o los borren en cualquier momento.',
  ].join('\n'),
}

export const RECORDATORIOS =
  'Quiero que me escriban por WhatsApp cada 6 meses para confirmar mis datos y mantener mis beneficios.'

export const AVISO_CONFIANZA =
  'Nunca te pediremos claves ni datos bancarios. Solo te escribiremos desde el número oficial de la Municipalidad.'
