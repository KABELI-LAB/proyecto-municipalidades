import { describe, expect, it } from "vitest";
import { etiquetas, puedeRed, rasgosAviso, textoAdopcion, textoAvistada, textoOperativo, textoPerdida } from "./redes";

const URL = "https://tenencia.ejemplo.cl";

describe("textos para Instagram", () => {
  it("el operativo dice cuándo, dónde, qué servicios y cómo inscribirse, con el enlace oficial", () => {
    const { texto, alternativo } = textoOperativo(
      { id: "op1", sector: "La Huerta", fecha: "sábado 24 de octubre", horaInicio: "09:00", horaFin: "14:00", lugar: "Escuela La Huerta", localidad: "La Huerta", servicios: ["Esterilización", "Vacunación", "Microchip"], requisitos: "" },
      "Hualañé",
      URL,
    );
    expect(texto).toContain("Sábado 24 de octubre, de 09:00 a 14:00 horas, en Escuela La Huerta, La Huerta.");
    expect(texto).toContain("Servicios: esterilización, vacunación y microchip.");
    expect(texto).toContain(`${URL}/operativos/op1`);
    expect(texto).not.toMatch(/Requisitos/);
    expect(alternativo).toMatch(/operativo/);
  });

  it("la adopción no afirma salud, vacunas ni esterilización y remite a la ficha oficial", () => {
    const { texto } = textoAdopcion({ id: "f1", nombre: "Canela", especie: "perro", tamano: "mediano", donde: "Quilico" }, "Hualañé", URL);
    expect(texto).toContain("Canela busca hogar.");
    expect(texto).toContain("Es un perro de tamaño mediano y está en Quilico.");
    expect(texto).not.toMatch(/vacun|esteriliz|san[oa]\b|desparasit/i);
    expect(texto).toContain(`${URL}/adoptar/f1`);
  });

  it("la mascota perdida lleva su nombre y la información del aviso, con el género correcto; nunca un teléfono", () => {
    const { texto, alternativo } = textoPerdida(
      { id: "p1", especie: "PERRO", sexo: "HEMBRA", color: "negro", tamano: "pequeño", localidad: "El Rincón", sector: "Hualañé", fecha: "13 de octubre de 2026", nombre: "Mancha", collar: "SI", colorCollar: "rojo", senas: "Mancha blanca en el pecho" },
      "Hualañé",
      URL,
    );
    expect(texto).toMatch(/^Se busca a Mancha\.\n\nPerra de color negro, tamaño pequeño\.\nLleva collar rojo\.\nSeñas: Mancha blanca en el pecho\.\n\nSe perdió el 13 de octubre de 2026 en El Rincón \(sector Hualañé\)\./);
    expect(texto).toContain("Si la vio o tiene información");
    expect(texto).toContain(`${URL}/mascotas/p1`);
    expect(alternativo).toBe("Fotografía de Mancha, una perra de color negro que se perdió en El Rincón (sector Hualañé).");
    // Sin nombre ni collar ni señas: lo que haya.
    const sinNombre = textoPerdida({ id: "p2", especie: "GATO", sexo: "DESCONOCIDO", color: "gris", tamano: null, localidad: null, sector: "Patacón", fecha: "5 de octubre de 2026", collar: "NO" }, "Hualañé", URL);
    expect(sinNombre.texto).toMatch(/^Se busca a este gato\.\n\nGato de color gris\.\nNo lleva collar\./);
    expect(sinNombre.texto).toContain("Si lo vio");
  });

  it("omite las señas si parecen incluir un teléfono, un correo o un RUT", () => {
    const base = { id: "p3", especie: "PERRO" as const, sexo: "MACHO" as const, color: "café", tamano: null, localidad: null, sector: "Hualañé", fecha: "5 de octubre de 2026" };
    expect(rasgosAviso({ ...base, senas: "Llamar al 9 1234 5678" })).toEqual(["Perro de color café."]);
    expect(rasgosAviso({ ...base, senas: "escribir a vecina@correo.cl" })).toEqual(["Perro de color café."]);
    expect(textoPerdida({ ...base, senas: "Llamar al 9 1234 5678" }, "Hualañé", URL).texto).not.toMatch(/1234/);
  });

  it("el avistamiento dice sus rasgos y dónde y cuándo se vio, no dónde está resguardado", () => {
    const { texto } = textoAvistada({ id: "a1", especie: "GATO", sexo: "HEMBRA", color: "gris", tamano: null, localidad: null, sector: "Patacón", fecha: "3 de octubre de 2026", collar: "NO_SE" }, "Hualañé", null);
    expect(texto).toMatch(/^¿Reconoce a esta gata\?\n\nGata de color gris\.\n\nFue vista el 3 de octubre de 2026 en el sector Patacón\./);
    expect(texto).toContain("Si es suya o la reconoce");
    expect(texto).not.toMatch(/resguard|retenid|veterinaria/i);
    // Sin dirección pública del portal, no inventa un enlace.
    expect(texto).toContain("en el portal de tenencia responsable de la municipalidad");
    expect(texto).not.toMatch(/https?:\/\//);
  });

  it("usa pocas etiquetas, sin espacios ni signos", () => {
    expect(etiquetas("Hualañé", ["MascotaPerdida"])).toBe("#MascotaPerdida #TenenciaResponsable #Hualañé");
    expect(etiquetas("San José de Maipo").split(" ")).toHaveLength(2);
    expect(etiquetas("San José de Maipo")).toContain("#SanJosédeMaipo");
  });
});

describe("estados", () => {
  it("solo se publica lo aprobado, o se reintenta tras un error", () => {
    expect(puedeRed("publicar", "APROBADO")).toBe(true);
    expect(puedeRed("publicar", "ERROR")).toBe(true);
    expect(puedeRed("publicar", "PUBLICADO")).toBe(false);
    expect(puedeRed("publicar", "PUBLICANDO")).toBe(false);
  });
});

describe("etiquetas de los avisos", () => {
  it("el tipo y la especie concuerdan con el sexo; el título es el nombre, con mayúscula", async () => {
    const { tipoAviso, especieConSexo, tituloAviso } = await import("./etiquetas");
    expect([tipoAviso("PERDIDA", "HEMBRA"), tipoAviso("PERDIDA", "MACHO"), tipoAviso("PERDIDA", "DESCONOCIDO")]).toEqual(["Perdida", "Perdido", "Perdida"]);
    expect([tipoAviso("ENCONTRADA", "HEMBRA"), tipoAviso("ENCONTRADA", "MACHO")]).toEqual(["Avistada", "Avistado"]);
    expect([especieConSexo("PERRO", "HEMBRA"), especieConSexo("GATO", "MACHO"), especieConSexo("OTRA", "HEMBRA")]).toEqual(["Perra", "Gato", "Otra especie"]);
    expect(tituloAviso({ nombreAnimal: "pelusa", especie: "PERRO", sexo: "HEMBRA", colorPrincipal: "café" })).toBe("Pelusa");
    expect(tituloAviso({ nombreAnimal: null, especie: "PERRO", sexo: "HEMBRA", colorPrincipal: "café" })).toBe("Perra café");
  });
});
