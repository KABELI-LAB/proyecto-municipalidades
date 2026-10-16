// Mapa ciudadano (/mapa): cada capa agrupa lo que comparte una ubicación
// aproximada (sector o lugar de referencia) y trae las fichas que se abren
// desde el mapa. Solo datos reales del sistema y públicos: nunca domicilios,
// contactos, cuidadores ni reportes ciudadanos (CLAUDE.md, mapa).
import "server-only";
import { fotoDeAviso } from "@/componentes/portal/fotoAviso";
import { fotoDeComunitario } from "@/componentes/portal/fotoComunitario";
import { fotosDeFicha } from "@/componentes/portal/fotoFicha";
import { radioPara, type CapaCiudadana, type CapaMapaCiudadano, type ItemMapa, type MarcaCiudadana } from "@/componentes/portal/marcasMapa";
import { REPORTE_COMUNITARIO } from "@/componentes/portal/TarjetaComunitario";
import { ESPECIE, SEXO, textoEdad, tipoAviso, tituloAviso } from "@/dominio/etiquetas";
import { punto, type Punto } from "@/dominio/geo";
import { nivelIntensidad } from "@/dominio/mapa";
import { municipioActivo } from "@/lib/municipio";
import { FICHA_PUBLICA } from "@/servidor/conFoto";
import { db } from "@/servidor/db";
import { fechaCorta, fechaLarga, hoyISO, numero, ventana } from "@/servidor/formato";
import { idsConCoincidencia, operativosAbiertos, perrosComunitarios, publicaciones } from "@/servidor/portal/consultas";

/** Fichas que se listan en el panel de una marca; el resto, en la lista completa. */
const MAXIMO_ITEMS = 8;
const plural = (n: number, uno: string, varios: string) => `${numero(n)} ${n === 1 ? uno : varios}`;
const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

type Grupo = { clave: string; centro: Punto; titulo: string; items: ItemMapa[]; extra?: Partial<MarcaCiudadana> };

/** Tamaño e intensidad según la cantidad de cada grupo, relativa al mayor. */
function aMarcas(grupos: Grupo[], cantidad: (g: Grupo) => number, detalle: (n: number) => string): MarcaCiudadana[] {
  const maximo = Math.max(0, ...grupos.map(cantidad));
  return grupos.map((g) => {
    const n = cantidad(g);
    return { clave: g.clave, centro: g.centro, titulo: g.titulo, radio: radioPara(n, maximo), nivel: nivelIntensidad(n, maximo), detalle: detalle(n), items: g.items.slice(0, MAXIMO_ITEMS), ...g.extra };
  });
}

/** Sectores del municipio con su centro aproximado, y las localidades para encuadrar el mapa. */
export async function territorioMapa() {
  const sectores = await db.sector.findMany({
    where: { municipioId: municipioActivo().id },
    orderBy: { orden: "asc" },
    select: { id: true, clave: true, nombre: true, centroLat: true, centroLng: true, localidades: { select: { lat: true, lng: true } } },
  });
  return {
    sectores: sectores.map((s) => ({ id: s.id, clave: s.clave, nombre: s.nombre, centro: punto(s.centroLat, s.centroLng) })),
    localidades: sectores.flatMap((s) => s.localidades.flatMap((l) => punto(l.lat, l.lng) ?? [])),
  };
}
type Sector = Awaited<ReturnType<typeof territorioMapa>>["sectores"][number];

/** Agrupa por sector; los sectores sin coordenada no se dibujan. */
function porSector<T>(sectores: Sector[], filas: T[], sectorDe: (x: T) => string | null, item: (x: T) => ItemMapa, extra?: (s: Sector, xs: T[]) => Partial<MarcaCiudadana>): Grupo[] {
  return sectores.flatMap((s) => {
    const xs = filas.filter((x) => sectorDe(x) === s.id);
    return s.centro && xs.length ? [{ clave: s.clave, centro: s.centro, titulo: s.nombre, items: xs.map(item), extra: extra?.(s, xs) }] : [];
  });
}

/** Agrupa por coordenada: lugares de referencia que comparten punto aproximado van en una sola marca. */
function porPunto<T>(filas: T[], centroDe: (x: T) => Punto | null, titulo: (xs: T[]) => string, item: (x: T) => ItemMapa, extra?: (xs: T[]) => Partial<MarcaCiudadana>): Grupo[] {
  const grupos = new Map<string, { centro: Punto; xs: T[] }>();
  for (const x of filas) {
    const c = centroDe(x);
    if (!c) continue;
    const clave = `${c.lat.toFixed(4)},${c.lng.toFixed(4)}`;
    const g = grupos.get(clave) ?? { centro: c, xs: [] };
    g.xs.push(x);
    grupos.set(clave, g);
  }
  return [...grupos.entries()].map(([clave, g]) => ({ clave, centro: g.centro, titulo: titulo(g.xs), items: g.xs.map(item), extra: extra?.(g.xs) }));
}

// ───────────── Capas ─────────────

async function capaMascotas(sectores: Sector[]): Promise<CapaCiudadana> {
  const [avisos, coincidencias] = await Promise.all([publicaciones({}), idsConCoincidencia()]);
  const grupos = porSector(
    sectores,
    avisos,
    (p) => p.sectorId,
    (p) => ({
      clave: p.id,
      titulo: `${tituloAviso(p)} · ${tipoAviso(p.tipo, p.sexo).toLowerCase()}`,
      lineas: [`${p.localidad?.nombre ?? p.sector.nombre} · ${fechaCorta(p.fechaEvento)}`],
      href: `/mascotas/${p.id}`,
      // Nunca se afirma que es el mismo animal: es una sugerencia para revisar.
      etiqueta: coincidencias.has(p.id) ? "Posible coincidencia: revisa el aviso" : undefined,
      foto: fotoDeAviso(p) ?? undefined,
    }),
    (s, xs) => ({
      cifras: [
        { valor: xs.filter((p) => p.tipo === "PERDIDA").length, texto: "perdidas" },
        { valor: xs.filter((p) => p.tipo === "ENCONTRADA").length, texto: "avistadas" },
      ],
      enlaces: [{ href: `/mascotas?sector=${s.clave}`, texto: `Ver los avisos de ${s.nombre}` }],
    }),
  );
  return {
    marcas: aMarcas(grupos, (g) => g.items.length, (n) => plural(n, "aviso", "avisos")),
    vacio: { texto: "No hay avisos vigentes de mascotas perdidas o avistadas.", enlace: { href: "/mascotas/publicar?tipo=PERDIDA", texto: "Reportar mascota perdida" } },
    nota: "Avisos contados por sector, en el centro aproximado del sector. Las posibles coincidencias son sugerencias por rasgos, no una confirmación.",
  };
}

async function capaAdopcion(sectores: Sector[]): Promise<CapaCiudadana> {
  const fichas = await db.fichaAdopcion.findMany({
    where: FICHA_PUBLICA,
    select: { id: true, estado: true, fotos: true, sectorId: true, animal: { select: { nombre: true, especie: true, sexo: true, edadAproxMeses: true, foto: true } } },
    orderBy: { publicadaEn: "asc" },
  });
  const sinSector = fichas.filter((f) => !f.sectorId).length;
  const grupos = porSector(
    sectores,
    fichas,
    (f) => f.sectorId,
    (f) => {
      const [foto] = fotosDeFicha(f);
      return {
        clave: f.id,
        titulo: f.animal.nombre ?? `${ESPECIE[f.animal.especie]} sin nombre`,
        lineas: [`${ESPECIE[f.animal.especie]} · ${SEXO[f.animal.sexo].toLowerCase()} · ${textoEdad(f.animal.edadAproxMeses).toLowerCase()}`],
        href: `/adoptar/${f.id}`,
        etiqueta: f.estado === "EN_PROCESO" ? "En proceso de adopción" : undefined,
        foto,
      };
    },
    () => ({ enlaces: [{ href: "/adoptar", texto: "Ver el catálogo de adopción" }] }),
  );
  return {
    marcas: aMarcas(grupos, (g) => g.items.length, (n) => plural(n, "animal", "animales")),
    vacio: { texto: "Por ahora no hay animales en adopción.", enlace: { href: "/adoptar/dar", texto: "Dar en adopción" } },
    nota: `Ubicación aproximada: el sector donde está el animal, nunca una dirección.${sinSector ? ` ${plural(sinSector, "animal sin sector aparece", "animales sin sector aparecen")} solo en el catálogo.` : ""}`,
  };
}

async function capaOperativos(sectores: Sector[]): Promise<CapaCiudadana> {
  const operativos = await operativosAbiertos();
  const lugares = new Map((await db.lugar.findMany({ where: { id: { in: operativos.map((o) => o.lugarId) } }, select: { id: true, lat: true, lng: true } })).map((l) => [l.id, punto(l.lat, l.lng)]));
  const centroSector = new Map(sectores.map((s) => [s.id, s.centro]));
  const grupos = porPunto(
    operativos,
    // En el lugar de referencia; si no tiene coordenada, en el centro del sector.
    (o) => lugares.get(o.lugarId) ?? centroSector.get(o.sectorId) ?? null,
    (os) => os[0].lugar.nombre,
    (o) => ({
      clave: o.id,
      titulo: `${mayuscula(fechaLarga(o.fecha))} · ${o.horaInicio} a ${o.horaFin}`,
      lineas: [
        `Operativo en ${o.sector.nombre} · ${o.lugar.nombre}`,
        o.servicios.map((s) => `${s.nombre}: ${s.disponibles > 0 ? plural(s.disponibles, "cupo", "cupos") : "lista de espera"}`).join(" · "),
      ],
      href: `/operativos/${o.id}`,
    }),
    () => ({ enlaces: [{ href: "/operativos", texto: "Ver todos los operativos" }] }),
  );
  return {
    marcas: aMarcas(grupos, (g) => g.items.length, (n) => plural(n, "operativo", "operativos")),
    vacio: { texto: "Por ahora no hay operativos publicados. Registra tu interés y te avisaremos cuando haya uno cerca.", enlace: { href: "/servicio", texto: "Solicitar un servicio" } },
    nota: "Cada operativo, en su lugar de referencia (sede, escuela, posta). Cupos disponibles al momento de abrir el mapa.",
  };
}

async function capaComunitarios(): Promise<CapaCiudadana> {
  const [perros, ubicaciones] = await Promise.all([
    perrosComunitarios(),
    db.perroComunitario.findMany({
      where: { sector: { municipioId: municipioActivo().id } },
      select: { id: true, ultimoControl: true, lugar: { select: { lat: true, lng: true } } },
    }),
  ]);
  const datos = new Map(ubicaciones.map((u) => [u.id, { centro: punto(u.lugar.lat, u.lugar.lng), revision: u.ultimoControl }]));
  const grupos = porPunto(
    perros,
    (c) => datos.get(c.id)?.centro ?? null,
    (cs) => cs[0].lugar.localidad.nombre,
    (c) => {
      const revision = datos.get(c.id)?.revision;
      const foto = fotoDeComunitario(c);
      return {
        clave: c.id,
        titulo: c.animal.nombre ?? c.apodo,
        // Fecha de la última revisión registrada: no se afirma cómo está hoy el perro.
        lineas: [c.lugar.nombre, revision ? `Última revisión registrada: ${fechaCorta(revision)}` : "Sin revisión registrada", "Para informar una novedad o hacerte cargo, abre su ficha"],
        href: `/comunitarios/${c.id}`,
        foto: foto ?? undefined,
      };
    },
    (cs) => ({
      enlaces: [
        // Con un solo perro en el lugar, su ficha; con varios, se elige el perro en la lista.
        cs.length === 1 ? { href: `/comunitarios/${cs[0].id}`, texto: "Ver su ficha", principal: true } : { href: REPORTE_COMUNITARIO, texto: "¿Es urgente? SOS Mascotas" },
        { href: `/comunitarios?sector=${cs[0].sector.clave}`, texto: `Perros comunitarios de ${cs[0].sector.nombre}` },
      ],
    }),
  );
  return {
    marcas: aMarcas(grupos, (g) => g.items.length, (n) => plural(n, "perro", "perros")),
    vacio: { texto: "No hay perros comunitarios registrados." },
    nota: "Cada perro, en su lugar de referencia público. No mostramos quién lo cuida.",
  };
}

async function capaResultados(sectores: Sector[]): Promise<CapaCiudadana> {
  const v12 = ventana(365, hoyISO());
  const enAnio = { gte: v12.desde, lt: v12.hasta };
  const enMunicipio = { sector: { municipioId: municipioActivo().id } };
  const [atenciones, operativos, reencuentros, adopciones] = await Promise.all([
    db.atencion.groupBy({ by: ["sectorId"], where: { resultado: "REALIZADA", realizadaEn: enAnio, ...enMunicipio }, _count: { _all: true } }),
    db.operativo.groupBy({ by: ["sectorId"], where: { estado: "CERRADO", fecha: enAnio, ...enMunicipio }, _count: { _all: true } }),
    db.publicacionMascota.groupBy({ by: ["sectorId"], where: { tipo: "PERDIDA", estado: "REENCONTRADA", resueltaEn: enAnio, ...enMunicipio }, _count: { _all: true } }),
    db.fichaAdopcion.groupBy({ by: ["sectorAdoptanteId"], where: { estado: "ADOPTADO", adoptadaEn: enAnio, sectorAdoptante: { municipioId: municipioActivo().id } }, _count: { _all: true } }),
  ]);
  // Cantidad por sector de cada conteo agrupado.
  const mapa = (filas: { id: string | null; n: number }[]) => new Map(filas.map((x) => [x.id, x.n]));
  const porAtencion = mapa(atenciones.map((x) => ({ id: x.sectorId, n: x._count._all })));
  const porOperativo = mapa(operativos.map((x) => ({ id: x.sectorId, n: x._count._all })));
  const porAdopcion = mapa(adopciones.map((x) => ({ id: x.sectorAdoptanteId, n: x._count._all })));
  const porReencuentro = mapa(reencuentros.map((x) => ({ id: x.sectorId, n: x._count._all })));
  const grupos: Grupo[] = sectores.flatMap((s) => {
    if (!s.centro) return [];
    const cifras = [
      { valor: porAtencion.get(s.id) ?? 0, texto: "atenciones" },
      { valor: porOperativo.get(s.id) ?? 0, texto: "operativos" },
      { valor: porAdopcion.get(s.id) ?? 0, texto: "adopciones" },
      { valor: porReencuentro.get(s.id) ?? 0, texto: "volvieron a casa" },
    ];
    return [{ clave: s.clave, centro: s.centro, titulo: s.nombre, items: [], extra: { cifras } }];
  });
  const total = (g: Grupo) => g.extra?.cifras?.[0].valor ?? 0;
  const conDatos = grupos.some((g) => g.extra?.cifras?.some((c) => c.valor > 0));
  return {
    marcas: conDatos ? aMarcas(grupos, total, (x) => plural(x, "atención", "atenciones")) : [],
    vacio: { texto: "Aún no hay resultados registrados en los últimos 12 meses." },
    nota: "Últimos 12 meses. El tamaño muestra las atenciones; las adopciones se cuentan en el sector de quien adopta.",
  };
}

/** Datos de una capa del mapa ciudadano, más el territorio para encuadrarlo. */
export async function mapaCiudadano(capa: CapaMapaCiudadano) {
  const t = await territorioMapa();
  const datos =
    capa === "mascotas"
      ? await capaMascotas(t.sectores)
      : capa === "adopcion"
        ? await capaAdopcion(t.sectores)
        : capa === "operativos"
          ? await capaOperativos(t.sectores)
          : capa === "comunitarios"
            ? await capaComunitarios()
            : await capaResultados(t.sectores);
  return { ...datos, localidades: t.localidades };
}
