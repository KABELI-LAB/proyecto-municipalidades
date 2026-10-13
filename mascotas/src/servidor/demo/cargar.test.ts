// Carga demo/datos/ en una base temporal y la compara con resumen.json y
// prioridad.json usando la fecha de corte fija (6 de octubre de 2026).
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import { municipioActivo } from "@/lib/municipio";
import { cargarDemo, rasgosAPublicacion } from "./cargar";
import { verificarDemo } from "./verificar";

const CORTE = "2026-10-06";
let carpeta: string;
let db: PrismaClient;

beforeAll(async () => {
  process.env.MUNICIPIO ??= "hualane";
  carpeta = mkdtempSync(join(tmpdir(), "tenencia-demo-"));
  const url = `file:${join(carpeta, "prueba.db").replace(/\\/g, "/")}`;
  // Se aplican las migraciones del proyecto, en orden.
  const cliente = createClient({ url });
  const migraciones = join(process.cwd(), "prisma", "migrations");
  for (const m of readdirSync(migraciones).filter((d) => /^\d{14}_/.test(d)).sort()) {
    await cliente.executeMultiple(readFileSync(join(migraciones, m, "migration.sql"), "utf8"));
  }
  cliente.close();
  db = new PrismaClient({ adapter: new PrismaLibSql({ url }) });
  await cargarDemo(db, { municipio: municipioActivo(), hoy: CORTE, contrasena: "contrasena-de-prueba" });
}, 120_000);

afterAll(async () => {
  await db?.$disconnect();
  // En Windows el archivo puede seguir bloqueado hasta que termina el proceso: es temporal, no importa si queda.
  try {
    rmSync(carpeta, { recursive: true, force: true });
  } catch {}
});

describe("carga de demo/datos/", () => {
  it("reproduce resumen.json y los factores de prioridad.json con la fecha de corte", async () => {
    const { filas, ok } = await verificarDemo(db, municipioActivo(), CORTE);
    const distintas = filas.filter((f) => f.esperado !== f.obtenido);
    expect(distintas).toEqual([]);
    expect(ok).toBe(true);
  });

  it("carga el territorio y los catálogos tal cual", async () => {
    expect(await db.sector.count()).toBe(4);
    expect(await db.localidad.count()).toBe(28);
    expect(await db.lugar.count()).toBe(10);
    // Las seis categorías de SOS Mascotas, y los tipos anteriores inactivos (clasifican los reportes de la demo).
    const tipos = await db.tipoReporte.findMany({ orderBy: { orden: "asc" } });
    expect(tipos.filter((t) => t.activo).map((t) => t.clave)).toEqual([
      "animal herido", "maltrato o abandono", "animal agresivo", "animal comunitario sin atencion", "animal atrapado", "otro",
    ]);
    expect(tipos.filter((t) => !t.activo).map((t) => t.clave)).toEqual(["abandono", "jauria", "atropello", "maltrato"]);
    expect((await db.servicio.findMany()).map((s) => s.clave).sort()).toEqual(["esterilizacion", "microchip", "vacunacion"]);
  });

  it("deja la escena en vivo lista: ope-05 y avi-02 en borrador, unidos", async () => {
    const op = await db.operativo.findUniqueOrThrow({ where: { id: "ope-05" }, include: { avisos: true, capacidades: { include: { servicio: true } }, asignaciones: true } });
    expect(op.estado).toBe("BORRADOR");
    expect(op.avisos.map((a) => [a.id, a.estado])).toEqual([["avi-02", "BORRADOR"]]);
    expect(Object.fromEntries(op.capacidades.map((c) => [c.servicio.clave, c.cupos]))).toEqual({ esterilizacion: 20, vacunacion: 40, microchip: 40 });
    expect(op.asignaciones.map((a) => a.usuarioId)).toEqual(["usr-02"]);
  });

  it("cada ficha de adopción la propuso un vecino, con su código; sus postulaciones aceptan compartir el contacto", async () => {
    const fichas = await db.fichaAdopcion.findMany();
    expect(fichas).toHaveLength(26);
    expect(fichas.every((f) => f.proponenteId && f.codigo && f.revision === "APROBADA" && f.sectorId && f.autorizaPublicar)).toBe(true);
    expect(new Set(fichas.map((f) => f.codigo)).size).toBe(26);
    expect(await db.postulacionAdopcion.count({ where: { compartirContacto: false } })).toBe(0);
  });

  it("guarda la coincidencia sugerida del perro café con collar rojo", async () => {
    const c = await db.coincidencia.findFirstOrThrow({ where: { perdidaId: "pub-047", encontradaId: "pub-048" } });
    expect(c.estado).toBe("SUGERIDA");
    expect(c.motivos).toContain("Ambos con collar");
  });

  it("no publica nada que no esté en los datos: los reportes y publicaciones no traen código", async () => {
    expect(await db.reporteCiudadano.count({ where: { codigo: { not: null } } })).toBe(0);
    expect(await db.solicitudServicio.count({ where: { codigo: { startsWith: "TR-" } } })).toBe(76);
  });

  it("borrar la demo no toca la configuración", async () => {
    const { borrarDatosDemo } = await import("./borrar");
    await borrarDatosDemo(db);
    expect(await db.persona.count()).toBe(0);
    expect(await db.operativo.count()).toBe(0);
    expect(await db.loteDemo.count()).toBe(0);
    expect(await db.sector.count()).toBe(4);
    expect(await db.tipoReporte.count()).toBe(10);
  });
});

describe("rasgos de un animal en una publicación", () => {
  it("separa collar y señas particulares", () => {
    expect(rasgosAPublicacion("collar rojo")).toEqual({ collar: "SI", colorCollar: "rojo", senas: null });
    expect(rasgosAPublicacion("sin rasgos visibles")).toEqual({ collar: null, colorCollar: null, senas: null });
    expect(rasgosAPublicacion("oreja caída")).toEqual({ collar: null, colorCollar: null, senas: "Oreja caída." });
  });
});
