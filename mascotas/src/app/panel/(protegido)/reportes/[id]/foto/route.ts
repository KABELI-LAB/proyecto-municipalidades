// Foto de un reporte de SOS Mascotas: solo para el equipo municipal con
// permiso de ver reportes y solo de reportes de su municipio. Nunca se guarda
// en caché compartida.
import { municipioActivo } from "@/lib/municipio";
import { leerFoto } from "@/servidor/archivos";
import { autorizar } from "@/servidor/auth";
import { db } from "@/servidor/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await autorizar("verReportes"))) return new Response("No autorizado", { status: 403 });
  const { id } = await params;
  const reporte = await db.reporteCiudadano.findFirst({ where: { id, sector: { municipioId: municipioActivo().id } }, select: { fotoArchivo: true } });
  const foto = reporte?.fotoArchivo ? await leerFoto("reportes", reporte.fotoArchivo) : null;
  if (!foto) return new Response("No encontrada", { status: 404 });
  return new Response(new Uint8Array(foto), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}
