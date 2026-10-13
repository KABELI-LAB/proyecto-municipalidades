import { describe, expect, it } from "vitest";
import { destinoVolver } from "./destinoVolver";

const sin = new URLSearchParams();

describe("destinoVolver", () => {
  it("en una sección principal solo hay «Inicio»", () => {
    expect(destinoVolver("portal", "/adoptar", sin)).toBeNull();
    expect(destinoVolver("panel", "/panel/operativos", sin)).toBeNull();
  });
  it("cada bandeja y «Por aprobar» cuelgan del inicio del panel: solo «Inicio»", () => {
    expect(destinoVolver("panel", "/panel/coincidencias", sin)).toBeNull();
    expect(destinoVolver("panel", "/panel/aprobar", sin)).toBeNull();
  });
  it("desde una ficha vuelve a su sección", () => {
    expect(destinoVolver("portal", "/adoptar/adp-01", sin)).toEqual({ href: "/adoptar", texto: "Volver a Adopción" });
    expect(destinoVolver("portal", "/mascotas/publicar", sin)).toEqual({ href: "/mascotas", texto: "Volver a Perdidas y avistadas" });
    expect(destinoVolver("panel", "/panel/operativos/ope-01", sin)).toEqual({ href: "/panel/operativos", texto: "Volver a Operativos" });
  });
  it("desde editar un operativo vuelve al operativo", () => {
    expect(destinoVolver("panel", "/panel/operativos/ope-05/editar", sin)).toEqual({ href: "/panel/operativos/ope-05", texto: "Volver al operativo" });
  });
  it("crear un operativo desde un sector vuelve a ese sector", () => {
    expect(destinoVolver("panel", "/panel/operativos/nuevo", sin)).toEqual({ href: "/panel/operativos", texto: "Volver a Operativos" });
  });
  it("la asistencia de un operativo vuelve a su ficha", () => {
    expect(destinoVolver("panel", "/panel/operativos/ope-05/asistencia", sin)?.href).toBe("/panel/operativos/ope-05");
  });
});
