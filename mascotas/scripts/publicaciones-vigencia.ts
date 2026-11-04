// Revisión diaria de vigencias: pide confirmar los avisos que cumplen 30 días
// y archiva los que no respondieron en 7 días (docs/concepto.md, sección 6).
// Uso: npm run publicaciones:vigencia   (en producción, una vez al día)
// Recorre cada municipio configurado, con sus avisos y su firma en los correos.
import { conMunicipio, idsMunicipios, municipioPorId } from "@/lib/municipio";
import { db } from "@/servidor/db";
import { revisarVigencias } from "@/servidor/vigencias";

async function todos() {
  const total = { pedidas: 0, archivadas: 0 };
  for (const id of idsMunicipios()) {
    const r = await conMunicipio(id, () => revisarVigencias(db, municipioPorId(id).zonaHoraria));
    total.pedidas += r.pedidas;
    total.archivadas += r.archivadas;
  }
  return total;
}

todos()
  .then((r) => console.log(`Vigencias revisadas: ${r.pedidas} confirmaciones pedidas, ${r.archivadas} avisos archivados.`))
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
