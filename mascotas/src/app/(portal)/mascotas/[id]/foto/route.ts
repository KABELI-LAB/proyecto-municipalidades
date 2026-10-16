// Foto subida con un aviso de mascota perdida o avistada. Pública mientras el
// aviso está vigente y aceptado por el municipio; antes de eso (o si se
// ocultó), solo la ve el equipo que modera publicaciones.
import { PREFIJO_FOTO_AVISO } from "@/componentes/portal/fotoAviso";
import { municipioActivo } from "@/lib/municipio";
import { leerFoto } from "@/servidor/archivos";
import { autorizar } from "@/servidor/auth";
import { db } from "@/servidor/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await db.publicacionMascota.findFirst({ where: { id, sector: { municipioId: municipioActivo().id } }, select: { fotoUrl: true, estado: true, moderacion: true } });
  const nombre = p?.fotoUrl?.startsWith(PREFIJO_FOTO_AVISO) ? p.fotoUrl.slice(PREFIJO_FOTO_AVISO.length) : null;
  if (!p || !nombre) return new Response("No encontrada", { status: 404 });
  const publica = p.estado === "ABIERTA" && p.moderacion === "APROBADA";
  if (!publica && !(await autorizar("moderarPublicaciones"))) return new Response("No encontrada", { status: 404 });
  const foto = await leerFoto("avisos", nombre);
  if (!foto) return new Response("No encontrada", { status: 404 });
  return new Response(new Uint8Array(foto), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
