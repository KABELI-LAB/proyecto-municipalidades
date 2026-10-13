// Foto principal de un perro comunitario subida por el equipo municipal. La
// ficha oficial es pública, así que su foto también; el archivo vive fuera de
// public/ y solo se entrega la foto registrada en la ficha.
import { PREFIJO_SUBIDA } from "@/componentes/portal/fotoComunitario";
import { municipioActivo } from "@/lib/municipio";
import { leerFoto } from "@/servidor/archivos";
import { db } from "@/servidor/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await db.perroComunitario.findFirst({ where: { id, sector: { municipioId: municipioActivo().id } }, select: { fotos: true } });
  const nombre = c?.fotos.split(",").find((f) => f.startsWith(PREFIJO_SUBIDA))?.slice(PREFIJO_SUBIDA.length);
  const foto = nombre ? await leerFoto("comunitarios", nombre) : null;
  if (!foto) return new Response("No encontrada", { status: 404 });
  return new Response(new Uint8Array(foto), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=300", "X-Content-Type-Options": "nosniff" } });
}
