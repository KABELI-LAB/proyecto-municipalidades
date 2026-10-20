// Borra de una vez todos los datos de demostración. La configuración del
// municipio (sectores, servicios, pesos) se mantiene.
// Uso: npm run demo:borrar
import { db } from "@/servidor/db";
import { borrarDatosDemo } from "@/servidor/demo/borrar";

borrarDatosDemo(db)
  .then((total) => console.log(total > 0 ? `Datos de demostración borrados: ${total} registros.` : "No había datos de demostración."))
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
