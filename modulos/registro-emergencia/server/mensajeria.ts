/**
 * WhatsApp (brief 10). Solo plantillas y botones de respuesta rápida.
 * El proveedor real (Cloud API de Meta o un BSP) está pendiente de decisión:
 * mientras tanto se usa ConsoleProvider, que no envía nada.
 */

export type Plantilla =
  | 'tarjeta_activada'
  | 'codigo_familiar'
  | 'recordatorio_6m'
  | 'segundo_aviso'
  | 'link_edicion'
  | 'beneficio_nuevo'

export interface MensajeEnviado {
  mensajeId: string
  to: string
  plantilla: Plantilla
  params: Record<string, string>
  botones: string[]
  enviadoAt: Date
}

export interface MessagingProvider {
  sendTemplate(to: string, plantilla: Plantilla, params: Record<string, string>, botones?: string[]): Promise<{ mensajeId: string }>
}

/**
 * Desarrollo: guarda los mensajes en memoria (los muestra /dev/whatsapp) y
 * escribe en consola solo la plantilla y el final del número, nunca los datos.
 */
export class ConsoleProvider implements MessagingProvider {
  readonly enviados: MensajeEnviado[] = []

  async sendTemplate(to: string, plantilla: Plantilla, params: Record<string, string>, botones: string[] = []) {
    const mensajeId = `console-${Date.now().toString(36)}-${this.enviados.length}`
    this.enviados.push({ mensajeId, to, plantilla, params, botones, enviadoAt: new Date() })
    console.info(`[whatsapp:console] ${plantilla} → ···${to.slice(-4)} (${mensajeId})`)
    return { mensajeId }
  }
}
