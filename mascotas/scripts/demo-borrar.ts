// Borra de una vez los datos de demostración de un municipio (o de todos con
// --todos). La configuración del municipio (sectores, servicios, pesos) se mantiene.
// Uso: npm run demo:borrar                       (el municipio de MUNICIPIO)
//      npm run demo:borrar -- --municipio=curepto
//      npm run demo:borrar -- --todos
import { idsMunicipios, municipioPredeterminado } from "@/lib/municipio";
import { db } from "@/servidor/db";
import { borrarDatosDemo } from "@/servidor/demo/borrar";

async function main() {
  const elegido = process.argv.find((a) => a.startsWith("--municipio="))?.slice(12);
  const ids = process.argv.includes("--todos") ? idsMunicipios() : [elegido ?? municipioPredeterminado().id];
  for (const id of ids) {
    const total = await borrarDatosDemo(db, id);
    console.log(total > 0 ? `${id}: datos de demostración borrados (${total} registros).` : `${id}: no había datos de demostración.`);
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
