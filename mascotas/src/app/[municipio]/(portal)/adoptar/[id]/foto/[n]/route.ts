// Foto subida por quien propuso dar en adopción. Público solo mientras la ficha
// está publicada en el catálogo; antes (en revisión) o después (rechazada,
// oculta, retirada o adoptada), solo la ve el equipo que revisa adopciones.
import { leerFoto } from "@/servidor/archivos";
import { autorizar } from "@/servidor/auth";
import { FICHA_PUBLICA } from "@/servidor/conFoto";
import { db } from "@/servidor/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = await params;
  const ficha = await db.fichaAdopcion.findUnique({ where: { id }, select: { fotos: true } });
  const nombre = ficha?.fotos.split(",").filter(Boolean)[Number(n)];
  if (!nombre || !/^\d$/.test(n)) return new Response("No encontrada", { status: 404 });
  const publica = (await db.fichaAdopcion.count({ where: { id, ...FICHA_PUBLICA } })) > 0;
  if (!publica && !(await autorizar("gestionarAdopciones"))) return new Response("No encontrada", { status: 404 });
  const foto = await leerFoto("adopciones", nombre);
  if (!foto) return new Response("No encontrada", { status: 404 });
  return new Response(new Uint8Array(foto), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}
