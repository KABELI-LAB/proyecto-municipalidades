// Vigencia de las publicaciones de mascotas (docs/concepto.md, sección 6,
// paso 6): a los 30 días se pide confirmar; sin respuesta, se archiva.

export const DIAS_VIGENCIA = 30;
/** Días que se esperan a la respuesta antes de archivar. */
export const DIAS_PARA_RESPONDER = 7;

const DIA = 86_400_000;

type Publicacion = { estado: string; vigenteHasta: Date; vigenciaPedidaEn: Date | null };

/** Qué corresponde hacer hoy con una publicación: nada, pedir confirmación o archivarla. */
export function accionVigencia(p: Publicacion, ahora: Date): "ninguna" | "pedir" | "archivar" {
  if (p.estado !== "ABIERTA") return "ninguna";
  if (p.vigenciaPedidaEn) return ahora.getTime() >= p.vigenciaPedidaEn.getTime() + DIAS_PARA_RESPONDER * DIA ? "archivar" : "ninguna";
  return ahora.getTime() >= p.vigenteHasta.getTime() ? "pedir" : "ninguna";
}

/** Fecha límite para confirmar, una vez pedida la confirmación. */
export const limiteParaResponder = (pedidaEn: Date) => new Date(pedidaEn.getTime() + DIAS_PARA_RESPONDER * DIA);

/** Al confirmar, la publicación queda vigente otros 30 días. */
export const nuevaVigencia = (ahora: Date) => new Date(ahora.getTime() + DIAS_VIGENCIA * DIA);
