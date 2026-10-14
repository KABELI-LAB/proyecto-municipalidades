// Webhook de Instagram (comentarios y mensajes). Meta lo llama:
//   GET  al configurarlo: se responde hub.challenge si hub.verify_token coincide
//        con INSTAGRAM_WEBHOOK_TOKEN;
//   POST con cada comentario o mensaje, firmado con el App Secret de la app.
// Se contesta 200 de inmediato y la respuesta automática se hace después.
import { after } from "next/server";
import { firmaValida, procesarAviso } from "@/servidor/redes/respuestas";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const token = process.env.INSTAGRAM_WEBHOOK_TOKEN?.trim();
  if (p.get("hub.mode") === "subscribe" && token && p.get("hub.verify_token") === token) return new Response(p.get("hub.challenge") ?? "", { status: 200 });
  return new Response("No autorizado", { status: 403 });
}

export async function POST(request: Request) {
  const cuerpo = await request.text();
  if (!firmaValida(cuerpo, request.headers.get("x-hub-signature-256"))) {
    // Queda en el registro de Netlify para diagnosticar (sin claves ni contenido).
    console.warn("Webhook de Instagram: aviso rechazado por firma no válida. Revisa INSTAGRAM_APP_SECRET y META_APP_SECRET.");
    return new Response("Firma no válida", { status: 401 });
  }
  let aviso: unknown;
  try {
    aviso = JSON.parse(cuerpo);
  } catch {
    return new Response("Cuerpo no válido", { status: 400 });
  }
  after(async () => {
    try {
      await procesarAviso(aviso as Parameters<typeof procesarAviso>[0]);
    } catch (e) {
      console.error("No se pudo procesar el aviso de Instagram", e);
    }
  });
  return new Response("ok", { status: 200 });
}
