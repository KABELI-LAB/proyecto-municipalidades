// Carga los datos de demostración en la base: configuración (municipio,
// territorio, catálogos) y datos de demostración, con las fechas trasladadas a hoy.
// Cada municipio tiene los suyos (demo/municipios/<id>/datos/, o demo/datos/
// para el original); cargar uno no toca los de los demás.
// Uso: npm run demo:cargar                       (el municipio de MUNICIPIO)
//      npm run demo:cargar -- --municipio=curepto
//      npm run demo:cargar -- --todos            (cada municipio configurado)
//      opcional: --hoy=2026-10-06 para la fecha de corte original
import { idsMunicipios, municipioPorId, municipioPredeterminado } from "@/lib/municipio";
import { db } from "@/servidor/db";
import { cargarDemo } from "@/servidor/demo/cargar";
import { verificarDemo } from "@/servidor/demo/verificar";

const opcion = (nombre: string) => process.argv.find((a) => a.startsWith(`--${nombre}=`))?.slice(nombre.length + 3);

async function cargar(id: string, hoy: string | undefined) {
  const municipio = municipioPorId(id);
  const r = await cargarDemo(db, { municipio, hoy, contrasena: process.env.DEMO_CONTRASENA ?? "" });
  console.log(`\n${municipio.nombre}: demo cargada, corte ${r.fechaCorte} → ${r.hoy} (${r.desfaseDias} días trasladados).`);
  console.log(Object.entries(r.registros).map(([k, n]) => `${n} ${k}`).join(" · "));
  console.log(r.fotosAplicadas ? "Fotos: asignación aplicada." : "Fotos: sin asignar (asignacion.json no está aprobada).");

  const v = await verificarDemo(db, municipio, r.hoy);
  console.table(v.filas);
  if (!v.ok) {
    process.exitCode = 1;
    console.error(`${municipio.nombre}: las cifras cargadas no coinciden con su resumen.json y prioridad.json.`);
  }
}

async function main() {
  const hoy = opcion("hoy");
  const ids = process.argv.includes("--todos") ? idsMunicipios() : [opcion("municipio") ?? municipioPredeterminado().id];
  for (const id of ids) await cargar(id, hoy);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
