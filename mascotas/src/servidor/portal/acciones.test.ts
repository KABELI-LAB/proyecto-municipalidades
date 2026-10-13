// Trámites del portal sobre la demo cargada: la localidad se elige de la lista
// y de ella se deduce el sector; el mapa público no expone reportes ni
// datos internos de los perros comunitarios.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { crearBaseTemporal } from "@/pruebas/baseTemporal";

const CORTE = "2026-10-06";
// Fuera de una petición no hay caché de Next que revalidar.
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
const PERSONA = { nombre: "Persona de prueba", rut: "11.111.111-1", telefono: "912345678", correo: "" };

let base: Awaited<ReturnType<typeof crearBaseTemporal>>;
let db: typeof import("@/servidor/db").db;
let acciones: typeof import("./acciones");
let consultas: typeof import("./consultas");

const localidad = (clave: string) => db.localidad.findUniqueOrThrow({ where: { clave }, include: { sector: true } });

beforeAll(async () => {
  base = await crearBaseTemporal();
  process.env.DATABASE_URL = base.url;
  process.env.MUNICIPIO ??= "hualane";
  ({ db } = await import("@/servidor/db"));
  const { cargarDemo } = await import("@/servidor/demo/cargar");
  const { municipioActivo } = await import("@/lib/municipio");
  await cargarDemo(db, { municipio: municipioActivo(), hoy: CORTE, contrasena: "contrasena-de-prueba" });
  acciones = await import("./acciones");
  consultas = await import("./consultas");
}, 120_000);

afterAll(async () => {
  await db?.$disconnect();
  base?.borrar();
});

describe("localidad de una lista cerrada", () => {
  it("un reporte guarda la localidad y el sector que le corresponde", async () => {
    const quilico = await localidad("quilico");
    const r = await acciones.reportarSituacion({
      tipo: "animal comunitario sin atencion",
      urgencia: "PRONTO",
      especie: "PERRO",
      cantidad: "UNO",
      sigueEnLugar: "",
      descripcion: "Perro delgado cerca de la sede, sin agua.",
      localidadId: quilico.id,
      ...PERSONA,
    });
    expect(r.ok).toBe(true);
    const guardado = await db.reporteCiudadano.findFirstOrThrow({ where: { codigo: r.ok ? r.codigo : "" } });
    expect([guardado.localidadId, guardado.sectorId]).toEqual([quilico.id, quilico.sectorId]);
    expect(quilico.sector.clave).toBe("patacon");
  });

  it("rechaza una localidad que no está en la lista", async () => {
    const r = await acciones.reportarSituacion({ tipo: "otro", urgencia: "PUEDE_ESPERAR", especie: "", cantidad: "UNO", sigueEnLugar: "", descripcion: "Situación de prueba sin más detalle.", localidadId: "no-existe", ...PERSONA });
    expect(r).toMatchObject({ ok: false, errores: { localidadId: expect.any(String) } });
  });

  it("una publicación acepta solo colores del catálogo para perros y gatos", async () => {
    const huerta = await localidad("la-huerta");
    const base = { tipo: "ENCONTRADA", especie: "PERRO", tamano: "MEDIANO", sexo: "MACHO", nombreAnimal: "", collar: "NO", colorCollar: "", microchip: "", senas: "", fechaEvento: CORTE, resguardada: "no", localidadId: huerta.id, ...PERSONA };
    expect(await acciones.publicarMascota({ ...base, colorPrincipal: "dorado" })).toMatchObject({ ok: false, errores: { colorPrincipal: expect.any(String) } });
  });
});

describe("portal público", () => {
  it("el mosaico de la portada muestra fotos distintas, cada una con su historia", async () => {
    const m = await consultas.mosaicoInicio(8);
    expect(m).toHaveLength(8);
    expect(new Set(m.map((x) => x.foto)).size).toBe(8);
    // Alterna tipos: no son todas del mismo origen.
    const tipos = new Set(m.map((x) => x.clave.split("-")[0]));
    expect(tipos.size).toBeGreaterThanOrEqual(3);
    for (const x of m) if (x.href) expect(x.href).toMatch(/^\/(adoptar|mascotas|comunitarios)\//);
  });

  it("los posibles reencuentros son públicos y marcan ambos avisos", async () => {
    const pares = await consultas.posiblesReencuentros();
    expect(pares.map((c) => [c.perdida.id, c.encontrada.id])).toEqual([["pub-047", "pub-048"]]);
    const ids = await consultas.idsConCoincidencia();
    expect([...ids].sort()).toEqual(["pub-047", "pub-048"]);
  });

  it("el mapa cuenta publicaciones vigentes por sector y agrupa a los perros comunitarios por lugar", async () => {
    const m = await consultas.mapaPublico();
    const por = Object.fromEntries(m.sectores.map((s) => [s.clave, [s.perdidas, s.encontradas]]));
    // Solo avisos con foto: con la asignación aprobada, los 16 avisos activos tienen foto.
    expect(por).toEqual({ hualane: [5, 1], patacon: [2, 1], "los-coipos": [1, 0], "la-huerta": [4, 2] });
    expect(m.lugares.reduce((n, l) => n + l.perros.length, 0)).toBe(4);
    expect(JSON.stringify(m)).not.toMatch(/reporte/i);
  });

  it("las fichas de perros comunitarios no traen cuidadores ni controles", async () => {
    const perros = await consultas.perrosComunitarios();
    // Solo los que tienen foto: com-01, com-02, com-04 y com-05.
    expect(perros.map((p) => p.id).sort()).toEqual(["com-01", "com-02", "com-04", "com-05"]);
    expect(perros.some((p) => "cuidadores" in p || "ultimoControl" in p || "necesitaAtencion" in p)).toBe(false);
  });
});

describe("cierre y vigencia de un aviso propio", () => {
  async function publicar() {
    const huerta = await localidad("la-huerta");
    const r = await acciones.publicarMascota({
      tipo: "PERDIDA", especie: "GATO", tamano: "PEQUENO", sexo: "HEMBRA", nombreAnimal: "Mota", collar: "NO", colorCollar: "", microchip: "NO", senas: "",
      fechaEvento: (await import("@/servidor/formato")).hoyISO(), resguardada: "", colorPrincipal: "negro", localidadId: huerta.id, ...PERSONA,
    });
    if (!r.ok) throw new Error(JSON.stringify(r));
    return r.codigo;
  }

  it("solo quien publicó, con su RUT y el código, puede cerrar el aviso", async () => {
    const codigo = await publicar();
    expect((await acciones.gestionarAviso({ rut: "22.222.222-2", codigo, accion: "no_aplica" })).ok).toBe(false);
    expect((await acciones.gestionarAviso({ rut: PERSONA.rut, codigo, accion: "reencontrada", porCoincidencia: "" })).ok).toBe(false);
    expect((await acciones.gestionarAviso({ rut: PERSONA.rut, codigo, accion: "reencontrada", porCoincidencia: "SI" })).ok).toBe(true);
    const p = await db.publicacionMascota.findFirstOrThrow({ where: { codigo } });
    expect([p.estado, p.reencuentroPorCoincidencia, p.resueltaEn !== null]).toEqual(["REENCONTRADA", true, true]);
    expect((await acciones.gestionarAviso({ rut: PERSONA.rut, codigo, accion: "confirmar" })).ok).toBe(false);
  });

  it("si el reencuentro vino de una coincidencia, se cierran ambos avisos y se avisa a la otra persona", async () => {
    const codigo = await publicar();
    const propia = await db.publicacionMascota.findFirstOrThrow({ where: { codigo } });
    const otra = await db.publicacionMascota.findFirstOrThrow({ where: { tipo: "ENCONTRADA", estado: "ABIERTA", moderacion: { not: "OCULTA" } } });
    const c = await db.coincidencia.upsert({
      where: { perdidaId_encontradaId: { perdidaId: propia.id, encontradaId: otra.id } },
      create: { perdidaId: propia.id, encontradaId: otra.id, puntaje: 0.8, motivos: "prueba" },
      update: { estado: "SUGERIDA" },
    });

    const consulta = await acciones.consultarSolicitudes({ rut: PERSONA.rut, codigo });
    if (!consulta.ok) throw new Error("consulta");
    const tramite = consulta.tramites.find((t) => t.codigo === codigo);
    expect(tramite?.aviso?.coincidencias.map((x) => x.id)).toContain(c.id);

    const antes = await db.notificacion.count();
    expect((await acciones.gestionarAviso({ rut: PERSONA.rut, codigo, accion: "reencontrada", porCoincidencia: "SI", coincidenciaId: c.id })).ok).toBe(true);
    const ambas = await db.publicacionMascota.findMany({ where: { id: { in: [propia.id, otra.id] } } });
    expect(ambas.map((p) => [p.estado, p.reencuentroPorCoincidencia])).toEqual([
      ["REENCONTRADA", true],
      ["REENCONTRADA", true],
    ]);
    expect((await db.coincidencia.findUniqueOrThrow({ where: { id: c.id } })).estado).toBe("VALIDADA");
    expect(await db.notificacion.count()).toBe(antes + 1);
  });

  it("no cierra el aviso de otra persona con una coincidencia ajena", async () => {
    const codigo = await publicar();
    const ajena = await db.coincidencia.findFirstOrThrow({ where: { perdida: { codigo: { not: codigo } } } });
    expect((await acciones.gestionarAviso({ rut: PERSONA.rut, codigo, accion: "reencontrada", porCoincidencia: "SI", coincidenciaId: ajena.id })).ok).toBe(false);
    expect((await db.publicacionMascota.findFirstOrThrow({ where: { codigo } })).estado).toBe("ABIERTA");
  });

  it("a los 30 días pide confirmar; si se confirma sigue 30 días más; sin respuesta en 7 días se archiva", async () => {
    const { revisarVigencias } = await import("@/servidor/vigencias");
    const zona = "America/Santiago";
    const [a, b] = [await publicar(), await publicar()];
    const vence = (await db.publicacionMascota.findFirstOrThrow({ where: { codigo: a } })).vigenteHasta;
    const dia = 86_400_000;

    // Solo cuentan los avisos de esta prueba: los de la demo vencen en otras fechas.
    const r1 = await revisarVigencias(db, zona, new Date(vence.getTime() + 1000));
    expect(r1.pedidas).toBeGreaterThanOrEqual(2);
    const pedida = await db.publicacionMascota.findFirstOrThrow({ where: { codigo: a } });
    expect(pedida.vigenciaPedidaEn).not.toBeNull();

    expect((await acciones.gestionarAviso({ rut: PERSONA.rut, codigo: a, accion: "confirmar" })).ok).toBe(true);
    const confirmada = await db.publicacionMascota.findFirstOrThrow({ where: { codigo: a } });
    expect(confirmada.vigenciaPedidaEn).toBeNull();

    await revisarVigencias(db, zona, new Date(vence.getTime() + 8 * dia));
    expect((await db.publicacionMascota.findFirstOrThrow({ where: { codigo: b } })).estado).toBe("ARCHIVADA");
    expect((await db.publicacionMascota.findFirstOrThrow({ where: { codigo: a } })).estado).toBe("ABIERTA");
  });
});

describe("cancelar mi cupo desde Mis solicitudes", () => {
  it("solo con su RUT; el lugar pasa a la lista de espera, que avanza en orden", async () => {
    const huerta = await localidad("la-huerta");
    // Solo en esta base de prueba: el operativo de octubre se publica con 1 cupo de esterilización.
    const o = await db.operativo.findFirstOrThrow({ where: { estado: "BORRADOR" }, include: { capacidades: { include: { servicio: true } } } });
    await db.operativo.update({ where: { id: o.id }, data: { estado: "PUBLICADO" } });
    const cap = o.capacidades.find((c) => c.servicio.clave === "esterilizacion")!;
    await db.capacidadServicio.update({ where: { operativoId_servicioId: { operativoId: o.id, servicioId: cap.servicioId } }, data: { cupos: (await db.cupo.count({ where: { operativoId: o.id, servicioId: cap.servicioId, estado: { in: ["INVITADO", "CONFIRMADO", "ASISTIO"] } } })) + 1 } });
    const inscribir = (nombre: string, rut: string) =>
      acciones.solicitarCupo({ operativoId: o.id, servicioId: cap.servicioId, especie: "GATO", nombreAnimal: "", sexo: "HEMBRA", tamano: "", edad: "36", nombre, rut, telefono: "912345678", correo: "", localidadId: huerta.id });
    const a = await inscribir("Primera persona", "15.234.567-4");
    const b = await inscribir("Segunda persona", "12.345.678-5");
    const c = await inscribir("Tercera persona", "11.111.111-1");
    expect([a, b, c].map((r) => (r.ok ? r.estado : r))).toEqual(["CONFIRMADO", "EN_LISTA_ESPERA", "EN_LISTA_ESPERA"]);
    const codigo = (r: typeof a) => (r.ok ? r.codigo : "");

    // Mis solicitudes ofrece cancelar.
    const consulta = await acciones.consultarSolicitudes({ rut: "15.234.567-4", codigo: codigo(a) });
    expect(consulta.ok && consulta.tramites.find((t) => t.codigo === codigo(a))?.cupo).toEqual({ enEspera: false });

    // Con un RUT ajeno, no.
    expect((await acciones.cancelarMiCupo({ rut: "12.345.678-5", codigo: codigo(a) })).ok).toBe(false);
    // Con el propio, sí: el primero en espera queda confirmado y el siguiente avanza al lugar 1.
    expect(await acciones.cancelarMiCupo({ rut: "15.234.567-4", codigo: codigo(a) })).toEqual({ ok: true, mensaje: "Cancelamos su cupo. Gracias por avisar: quedó libre para otra persona." });
    const estado = async (r: typeof a) => db.cupo.findUniqueOrThrow({ where: { codigo: codigo(r) }, select: { estado: true, posicionEspera: true } });
    expect(await estado(a)).toEqual({ estado: "CANCELADO_PERSONA", posicionEspera: null });
    expect(await estado(b)).toEqual({ estado: "CONFIRMADO", posicionEspera: null });
    expect(await estado(c)).toEqual({ estado: "EN_LISTA_ESPERA", posicionEspera: 1 });
    // No se cancela dos veces.
    expect((await acciones.cancelarMiCupo({ rut: "15.234.567-4", codigo: codigo(a) })).ok).toBe(false);
    // Salir de la lista de espera.
    expect((await acciones.cancelarMiCupo({ rut: "11.111.111-1", codigo: codigo(c) })).mensaje).toBe("Salió de la lista de espera.");
   }, 60_000);
});
