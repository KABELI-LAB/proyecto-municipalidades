import { describe, expect, it } from "vitest";
import { esquemaPostulacion, esquemaPublicacion, esquemaReporte, esquemaServicio, validarCampos } from "./esquemas";

const persona = { nombre: "", rut: "", telefono: "", correo: "", localidadId: "" };

describe("validación de trámites", () => {
  it("muestra de una vez los errores de campos y los de reglas cruzadas", () => {
    const e = validarCampos(esquemaReporte, { tipo: "animal herido", especie: "", cantidad: "", sigueEnLugar: "", descripcion: "", ...persona });
    expect(Object.keys(e)).toEqual(expect.arrayContaining(["cantidad", "sigueEnLugar", "telefono", "localidadId"]));
  });

  it("pide RUT solo donde hace falta: no en SOS, opcional en servicio, obligatorio en pérdida", () => {
    // SOS: sin RUT no hay error; un RUT mal escrito sí.
    const reporte = { tipo: "animal comunitario sin atencion", urgencia: "PRONTO", especie: "", cantidad: "UNO", sigueEnLugar: "", descripcion: "", ...persona };
    expect(validarCampos(esquemaReporte, reporte).rut).toBeUndefined();
    expect(validarCampos(esquemaReporte, { ...reporte, rut: "12.345.678-9" }).rut).toBeDefined();
    const servicio = { servicioId: "x", especie: "GATO", nombreAnimal: "", sexo: "HEMBRA", tamano: "", edad: "36", ...persona };
    expect(validarCampos(esquemaServicio, servicio).rut).toBeUndefined();
    // Pérdida: obligatorio. Avistamiento: no.
    expect(validarCampos(esquemaPublicacion, { tipo: "PERDIDA", ...persona }).rut).toBeDefined();
    expect(validarCampos(esquemaPublicacion, { tipo: "ENCONTRADA", ...persona }).rut).toBeUndefined();
  });

  it("pregunta si sigue en el lugar solo en abandono, animal herido o atropello", () => {
    const e = validarCampos(esquemaReporte, { tipo: "animal comunitario sin atencion", especie: "", cantidad: "UNO", sigueEnLugar: "", descripcion: "", ...persona });
    expect(e.sigueEnLugar).toBeUndefined();
  });

  it("exige tamaño para perros, no para gatos", () => {
    const base = { servicioId: "x", nombreAnimal: "", sexo: "HEMBRA", tamano: "", edad: "36", ...persona };
    expect(validarCampos(esquemaServicio, { ...base, especie: "PERRO" }).tamano).toBeDefined();
    expect(validarCampos(esquemaServicio, { ...base, especie: "GATO" }).tamano).toBeUndefined();
  });

  it("los servicios atienden solo perros y gatos", () => {
    const e = validarCampos(esquemaServicio, { servicioId: "x", especie: "OTRA", nombreAnimal: "", sexo: "HEMBRA", tamano: "", edad: "36", ...persona });
    expect(e.especie).toBeDefined();
  });

  it("pide detallar otros animales solo si los hay", () => {
    const base = { fichaId: "f", ...persona, tipoVivienda: "Parcela", experiencia: "SI", otrosAnimales: "" };
    expect(validarCampos(esquemaPostulacion, { ...base, tieneOtros: "SI" }).otrosAnimales).toBeDefined();
    expect(validarCampos(esquemaPostulacion, { ...base, tieneOtros: "NO" }).otrosAnimales).toBeUndefined();
  });
});

describe("dar en adopción: edad escrita", () => {
  it("acepta meses o «No se sabe», y rechaza vacío o más de 25 años", async () => {
    const { esquemaPropuesta } = await import("./esquemas");
    const edad = (x: string) => validarCampos(esquemaPropuesta, { edad: x }).edad;
    expect(edad("18")).toBeUndefined();
    expect(edad("NO_SE")).toBeUndefined();
    expect(edad("")).toBeDefined();
    expect(edad("999")).toBeDefined();
  });

  it("muestra la edad tal como se escribió", async () => {
    const { edadEscrita } = await import("@/dominio/propuestas");
    expect([edadEscrita(8), edadEscrita(24), edadEscrita(18), edadEscrita(null)]).toEqual(["8 meses", "2 años", "1 año y 6 meses", "No se sabe"]);
  });
});
