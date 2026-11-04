// Estados de una solicitud de servicio que cuentan como demanda pendiente:
// todavía no se atiende ni se canceló (docs/concepto.md, sección 9).
export const SOLICITUD_PENDIENTE = ["RECIBIDA", "INVITADO", "CUPO_CONFIRMADO", "EN_LISTA_ESPERA"] as const;
