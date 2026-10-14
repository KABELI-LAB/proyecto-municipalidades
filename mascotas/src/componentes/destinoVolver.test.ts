import { describe, expect, it } from "vitest";
import { destinoVolver } from "./destinoVolver";

describe("destinoVolver", () => {
  it("en una sección principal solo hay «Inicio»", () => {
    expect(destinoVolver("portal", "/adoptar")).toBeNull();
    expect(destinoVolver("panel", "/panel/operativos")).toBeNull();
  });
  it("cada bandeja y «Por aprobar» cuelgan del inicio del panel: solo «Inicio»", () => {
    expect(destinoVolver("panel", "/panel/coincidencias")).toBeNull();
    expect(destinoVolver("panel", "/panel/aprobar")).toBeNull();
  });
  it("desde una ficha vuelve a su sección", () => {
    expect(destinoVolver("portal", "/adoptar/adp-01")).toEqual({ href: "/adoptar", texto: "Volver a Adopción" });
    expect(destinoVolver("portal", "/mascotas/publicar")).toEqual({ href: "/mascotas", texto: "Volver a Perdidas y avistadas" });
    expect(destinoVolver("panel", "/panel/operativos/ope-01")).toEqual({ href: "/panel/operativos", texto: "Volver a Operativos" });
  });
  it("desde editar un operativo vuelve al operativo", () => {
    expect(destinoVolver("panel", "/panel/operativos/ope-05/editar")).toEqual({ href: "/panel/operativos/ope-05", texto: "Volver al operativo" });
  });
  it("crear un operativo desde un sector vuelve a ese sector", () => {
    expect(destinoVolver("panel", "/panel/operativos/nuevo")).toEqual({ href: "/panel/operativos", texto: "Volver a Operativos" });
  });
  it("la asistencia de un operativo vuelve a su ficha", () => {
    expect(destinoVolver("panel", "/panel/operativos/ope-05/asistencia")?.href).toBe("/panel/operativos/ope-05");
  });
});
