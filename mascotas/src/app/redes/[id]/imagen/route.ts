// Dirección pública de la pieza, para que Instagram la descargue al publicar
// (la API exige una imagen JPEG en un servidor público). Solo responde con la
// firma correcta, mientras se publica o ya publicada; datos de demostración solo si
// administración habilitó publicarlos para pruebas.
import { timingSafeEqual } from "node:crypto";
import { leerFoto } from "@/servidor/archivos";
import { db } from "@/servidor/db";
import { demoEnInstagram, firmaImagen } from "@/servidor/redes/servicio";

const igual = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export async function GET(solicitud: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const firma = new URL(solicitud.url).searchParams.get("f") ?? "";
  const p = await db.publicacionRed.findUnique({ where: { id }, select: { imagen: true, estado: true, loteDemoId: true } });
  if (!p || !["PUBLICANDO", "PUBLICADO"].includes(p.estado) || !igual(firma, firmaImagen(id, p.imagen))) return new Response("No encontrada", { status: 404 });
  if (p.loteDemoId && !(await demoEnInstagram())) return new Response("No encontrada", { status: 404 });
  const imagen = await leerFoto("redes", p.imagen);
  if (!imagen) return new Response("No encontrada", { status: 404 });
  return new Response(new Uint8Array(imagen), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" } });
}
