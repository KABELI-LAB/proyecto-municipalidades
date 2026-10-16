// Revisión diaria de vigencias: pide confirmar los avisos que cumplen 30 días
// y archiva los que no respondieron en 7 días (docs/concepto.md, sección 6).
// Uso: npm run publicaciones:vigencia   (en producción, una vez al día)
import { municipioActivo } from "@/lib/municipio";
import { db } from "@/servidor/db";
import { revisarVigencias } from "@/servidor/vigencias";

revisarVigencias(db, municipioActivo().zonaHoraria)
  .then((r) => console.log(`Vigencias revisadas: ${r.pedidas} confirmaciones pedidas, ${r.archivadas} avisos archivados.`))
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
