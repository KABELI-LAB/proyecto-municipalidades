// Carga demo/datos/ en la base: configuración (municipio, territorio,
// catálogos) y datos de demostración, con las fechas trasladadas a hoy.
// Uso: npm run demo:cargar   (opcional: --hoy=2026-10-06 para la fecha de corte original)
import { municipioActivo } from "@/lib/municipio";
import { db } from "@/servidor/db";
import { cargarDemo } from "@/servidor/demo/cargar";
import { verificarDemo } from "@/servidor/demo/verificar";

async function main() {
  const hoy = process.argv.find((a) => a.startsWith("--hoy="))?.slice(6);
  const municipio = municipioActivo();
  const r = await cargarDemo(db, { municipio, hoy, contrasena: process.env.DEMO_CONTRASENA ?? "" });
  console.log(`Demo cargada: corte ${r.fechaCorte} → ${r.hoy} (${r.desfaseDias} días trasladados).`);
  console.log(Object.entries(r.registros).map(([k, n]) => `${n} ${k}`).join(" · "));
  console.log(r.fotosAplicadas ? "Fotos: asignación aplicada." : "Fotos: sin asignar (demo/fotos/asignacion.json no está aprobada).");

  const v = await verificarDemo(db, municipio, r.hoy);
  console.table(v.filas);
  if (!v.ok) {
    process.exitCode = 1;
    console.error("Las cifras cargadas no coinciden con demo/datos/resumen.json y prioridad.json.");
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
