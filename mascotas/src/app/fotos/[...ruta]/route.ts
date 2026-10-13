// Sirve las fotos de demo/fotos/ (CLAUDE.md: solo esas fotos). Rechaza rutas
// fuera de la carpeta y archivos que no sean imágenes.
import { readFile } from "node:fs/promises";
import { join, normalize, sep } from "node:path";

const CARPETA = join(process.cwd(), "demo", "fotos");
const TIPOS: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };

export async function GET(_: Request, { params }: { params: Promise<{ ruta: string[] }> }) {
  const { ruta } = await params;
  const archivo = normalize(join(CARPETA, ...ruta));
  const tipo = TIPOS[archivo.split(".").pop()?.toLowerCase() ?? ""];
  if (!archivo.startsWith(CARPETA + sep) || !tipo) return new Response(null, { status: 404 });
  try {
    return new Response(new Uint8Array(await readFile(archivo)), { headers: { "Content-Type": tipo, "Cache-Control": "public, max-age=3600" } });
  } catch {
    return new Response(null, { status: 404 });
  }
}
