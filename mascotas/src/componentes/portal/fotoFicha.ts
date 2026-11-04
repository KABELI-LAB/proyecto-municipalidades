// Fotos de una ficha de adopción: la del animal (demo/fotos/, servida en
// /fotos/) y las que subió quien la propuso, que se entregan por una ruta que
// comprueba que la ficha esté publicada (o que quien la pide pueda revisarla).

export type FotoFicha = { src: string; subida: boolean };

export function fotosDeFicha(f: { id: string; fotos: string; animal: { foto: string | null } }): FotoFicha[] {
  const subidas = f.fotos
    .split(",")
    .filter(Boolean)
    .map((_, i) => ({ src: `/adoptar/${f.id}/foto/${i}`, subida: true }));
  return [...(f.animal.foto ? [{ src: `/fotos/${f.animal.foto}`, subida: false }] : []), ...subidas];
}
