// Envío de correos reales desde el servidor. Dos opciones, según lo que tenga
// la municipalidad:
//   - SMTP de la casilla institucional (Google Workspace, Microsoft 365, etc.)
//   - la API de Brevo (plan gratuito: 300 correos al día)
// Las credenciales viven solo en variables de entorno del servidor. Sin ellas,
// nada sale: las notificaciones quedan registradas como simuladas.
import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";

export type EstadoCorreo = { configurado: boolean; proveedor: "smtp" | "brevo" | null; faltantes: string[] };

const v = (k: string) => process.env[k]?.trim() ?? "";

/** Qué proveedor está configurado y qué falta. Nunca expone las credenciales. */
export function estadoCorreo(): EstadoCorreo {
  const remitente = v("CORREO_REMITENTE");
  if (v("BREVO_API_KEY")) return { configurado: Boolean(remitente), proveedor: "brevo", faltantes: remitente ? [] : ["CORREO_REMITENTE"] };
  if (v("SMTP_HOST")) {
    const faltantes = ["SMTP_USUARIO", "SMTP_CLAVE", "CORREO_REMITENTE"].filter((k) => !v(k));
    return { configurado: faltantes.length === 0, proveedor: "smtp", faltantes };
  }
  return { configurado: false, proveedor: null, faltantes: ["SMTP_HOST, SMTP_USUARIO y SMTP_CLAVE (casilla institucional) o BREVO_API_KEY", "CORREO_REMITENTE"] };
}

export type Correo = { para: string; asunto: string; texto: string };
export type ResultadoEnvio = { ok: true } | { ok: false; error: string };

const escapar = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Versión HTML sencilla: párrafos del texto y la firma del municipio (sin imágenes externas). */
function html(c: Correo, firma: string) {
  const parrafos = c.texto
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px">${escapar(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  return `<!doctype html><html lang="es"><body style="margin:0;padding:24px;background:#f5f1e8;font-family:Arial,Helvetica,sans-serif;color:#263238;font-size:16px;line-height:1.5">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:4px;overflow:hidden">
<div style="background:#174a6e;color:#ffffff;padding:16px 24px;font-weight:bold">${escapar(firma)}</div>
<div style="padding:24px">${parrafos}</div>
</div></body></html>`;
}

/** Remitente «Nombre <correo>» o solo el correo. */
function remitente() {
  const r = v("CORREO_REMITENTE");
  const m = r.match(/^(.*)<([^>]+)>\s*$/);
  return m ? { nombre: m[1].trim().replace(/^"|"$/g, ""), correo: m[2].trim() } : { nombre: "", correo: r };
}

export async function enviarCorreo(c: Correo, firma: string): Promise<ResultadoEnvio> {
  const estado = estadoCorreo();
  if (!estado.configurado) return { ok: false, error: "El envío de correos no está configurado." };
  const de = remitente();
  try {
    if (estado.proveedor === "brevo") {
      const r = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": v("BREVO_API_KEY"), "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ sender: { email: de.correo, ...(de.nombre ? { name: de.nombre } : {}) }, to: [{ email: c.para }], subject: c.asunto, textContent: c.texto, htmlContent: html(c, firma) }),
      });
      if (!r.ok) {
        const cuerpo = (await r.json().catch(() => ({}))) as { message?: string };
        return { ok: false, error: `Brevo respondió ${r.status}${cuerpo.message ? `: ${cuerpo.message}` : ""}` };
      }
      return { ok: true };
    }
    const nodemailer = await import("nodemailer");
    const puerto = Number(v("SMTP_PUERTO") || 587);
    const transporte = nodemailer.createTransport({ host: v("SMTP_HOST"), port: puerto, secure: puerto === 465, auth: { user: v("SMTP_USUARIO"), pass: v("SMTP_CLAVE") } });
    await transporte.sendMail({ from: v("CORREO_REMITENTE"), to: c.para, subject: c.asunto, text: c.texto, html: html(c, firma) });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 300) : "Error al enviar el correo." };
  }
}

/**
 * Envía las notificaciones en cola (estado PENDIENTE), después de que la
 * acción que las creó terminó de guardar. Las marca ENVIADA o FALLIDA.
 */
export async function enviarPendientes(db: PrismaClient, firma: string, limite = 20) {
  const pendientes = await db.notificacion.findMany({ where: { estado: "PENDIENTE", canal: "CORREO" }, orderBy: { creadaEn: "asc" }, take: limite });
  for (const n of pendientes) {
    // Se toma antes de enviar: si dos procesos coinciden, solo uno la envía.
    const tomada = await db.notificacion.updateMany({ where: { id: n.id, estado: "PENDIENTE" }, data: { estado: "FALLIDA", error: "Enviando…" } });
    if (!tomada.count) continue;
    const r = await enviarCorreo({ para: n.destinatario, asunto: n.asunto, texto: n.contenido }, firma);
    await db.notificacion.update({ where: { id: n.id }, data: r.ok ? { estado: "ENVIADA", enviadaEn: new Date(), error: null } : { estado: "FALLIDA", error: r.error } });
  }
  return pendientes.length;
}
