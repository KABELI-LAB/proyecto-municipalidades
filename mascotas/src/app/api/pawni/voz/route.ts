// Audio de la voz de Pawni para un texto firmado por el servidor.
// 404 si la voz no está configurada: el navegador usa entonces su propia voz.
import { MAXIMO_VOZ, audioDe, firmaVozValida } from "@/servidor/portal/voz";

export async function GET(pedido: Request) {
  const url = new URL(pedido.url);
  const texto = url.searchParams.get("t") ?? "";
  const firma = url.searchParams.get("f") ?? "";
  if (!texto || texto.length > MAXIMO_VOZ || !firmaVozValida(texto, firma)) return new Response("Texto no válido", { status: 400 });
  const audio = await audioDe(texto);
  if (!audio) return new Response("Sin voz", { status: 404 });
  return new Response(new Uint8Array(audio), {
    headers: {
      "Content-Type": "audio/mpeg",
      // El mismo texto da siempre el mismo audio: se guarda en el navegador y en la red de Netlify.
      "Cache-Control": "public, max-age=86400",
      "Netlify-CDN-Cache-Control": "public, max-age=2592000",
    },
  });
}
