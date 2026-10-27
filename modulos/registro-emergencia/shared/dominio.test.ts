import { describe, expect, it } from 'vitest'
import { ALFABETO_CODIGO, generarCodigoFamiliar, normalizarCodigo } from './codigo.ts'
import { hogarSchema, type HogarEntrada } from './esquemas.ts'
import { diasHasta, fechaLegible, fechaTabla, sumarMeses } from './fechas.ts'
import { generarPlanFamiliar, nombreTarjeta, vigenteHasta, type DatosPlan } from './incentivos.ts'
import { digitoVerificador, esRutValido, formatearRut, normalizarRut } from './rut.ts'
import { formatearCelular, normalizarCelular } from './telefono.ts'

describe('RUT', () => {
  it.each([
    ['12.345.678-5', '12345678-5'],
    ['123456785', '12345678-5'],
    ['11.111.111-1', '11111111-1'],
    ['7.654.321-6', '7654321-6'],
    [' 46713812-k ', '46713812-K'],
    ['43.624.222-0', '43624222-0'],
  ])('normaliza %s', (entrada, esperado) => {
    expect(normalizarRut(entrada)).toBe(esperado)
  })

  it.each(['12.345.678-K', '12345678-4', '1234-5', 'abc', '', '123456789-0'])('rechaza %s', (rut) => {
    expect(esRutValido(rut)).toBe(false)
  })

  it('calcula 0 y K como dígito verificador', () => {
    // Verificados a mano: 46713812 suma 133 (resto 1 → K); 43624222 suma 110 (resto 0 → 0).
    expect(digitoVerificador('46713812')).toBe('K')
    expect(digitoVerificador('43624222')).toBe('0')
  })

  it('formatea mientras se escribe', () => {
    expect(formatearRut('1')).toBe('1')
    expect(formatearRut('123456785')).toBe('12.345.678-5')
    expect(formatearRut('7654321-6')).toBe('7.654.321-6')
  })
})

describe('código familiar', () => {
  it('usa el formato FAM-XXXX-XX y solo el alfabeto permitido', () => {
    for (let i = 0; i < 200; i++) {
      const c = generarCodigoFamiliar()
      expect(c).toMatch(/^FAM-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{2}$/)
      for (const ch of c.slice(4).replace('-', '')) expect(ALFABETO_CODIGO).toContain(ch)
    }
  })

  it('no incluye 0, 1, I ni O', () => {
    expect(ALFABETO_CODIGO).not.toMatch(/[01IO]/)
    expect(ALFABETO_CODIGO).toHaveLength(32)
  })

  it('normaliza sin importar mayúsculas, guiones ni espacios', () => {
    expect(normalizarCodigo('fam 7k3q 82')).toBe('FAM-7K3Q-82')
    expect(normalizarCodigo('7k3q-82')).toBe('FAM-7K3Q-82')
    expect(normalizarCodigo('FAM-7K3Q-8O')).toBeNull() // O no existe en el alfabeto
    expect(normalizarCodigo('FAM-7K3Q')).toBeNull()
  })
})

describe('celular', () => {
  it('normaliza a E.164', () => {
    expect(normalizarCelular('9 1234 5678')).toBe('+56912345678')
    expect(normalizarCelular('+56 9 1234 5678')).toBe('+56912345678')
    expect(normalizarCelular('22 123 4567')).toBeNull()
    expect(formatearCelular('+56912345678')).toBe('+56 9 1234 5678')
  })
})

describe('fechas', () => {
  it('suma meses respetando el fin de mes', () => {
    expect(sumarMeses('2026-08-31', 6)).toBe('2027-02-28')
    expect(sumarMeses('2026-05-15', 6)).toBe('2026-11-15')
  })

  it('escribe fechas legibles y tabulares en es-CL', () => {
    expect(fechaLegible('2026-11-15')).toBe('domingo 15 de noviembre')
    expect(fechaTabla('2026-11-15')).toBe('15.11.26')
  })

  it('cuenta días hasta una fecha', () => {
    expect(diasHasta('2026-11-15', new Date('2026-11-05T15:00:00Z'))).toBe(10)
  })

  it('la vigencia es de 6 meses en hora de Santiago', () => {
    // 02:00 UTC del 1 de mayo todavía es 30 de abril en Santiago.
    expect(vigenteHasta(new Date('2026-05-01T02:00:00Z'))).toBe('2026-10-30')
  })
})

describe('tarjeta y plan familiar', () => {
  it('muestra solo el apellido en la tarjeta', () => {
    expect(nombreTarjeta('Rosa Modelo Muestra')).toBe('Familia Modelo')
    expect(nombreTarjeta('María José Pérez Soto')).toBe('Familia Pérez')
    expect(nombreTarjeta('Luis Ejemplo')).toBe('Familia Ejemplo')
    expect(nombreTarjeta('Camila')).toBe('Familia de Camila')
  })

  const base: DatosPlan = {
    totalPersonas: 3,
    menores18: 0,
    bebesMenores2: 0,
    mayores65: 0,
    mascotas: 0,
    ganadoTexto: null,
    puntoEncuentro: null,
    puntoEncuentroSugerido: 'Cancha de La Huerta',
    contactoEmergenciaNombre: null,
    contactoEmergenciaTelefono: null,
  }
  const items = (d: DatosPlan) => generarPlanFamiliar(d).mochila.flatMap((g) => g.items).join(' | ')

  it('agrega pañales y leche si hay guagua', () => {
    expect(items({ ...base, menores18: 1, bebesMenores2: 1 })).toMatch(/Pañales.*Leche/)
    expect(items(base)).not.toMatch(/Pañales/)
  })

  it('agrega correa, agua y alimento si hay mascotas', () => {
    expect(items({ ...base, mascotas: 2 })).toMatch(/Correa.*alimento/)
  })

  it('agrega medicamentos y recetas si hay personas mayores', () => {
    expect(items({ ...base, mayores65: 1 })).toMatch(/Medicamentos.*recetas/)
  })

  it('calcula el agua según las personas', () => {
    expect(items(base)).toContain('36 litros')
  })

  it('usa el punto sugerido del sector si no indicó uno', () => {
    expect(generarPlanFamiliar(base)).toMatchObject({ puntoEncuentro: 'Cancha de La Huerta', puntoEncuentroEsSugerido: true })
    expect(generarPlanFamiliar({ ...base, puntoEncuentro: 'Casa de la abuela' }).puntoEncuentroEsSugerido).toBe(false)
  })

  it('pone primero el contacto de emergencia', () => {
    const plan = generarPlanFamiliar({ ...base, contactoEmergenciaNombre: 'Tía Ana', contactoEmergenciaTelefono: '+56900001234' })
    expect(plan.telefonos[0]).toEqual({ nombre: 'Tía Ana', numero: '+56900001234' })
  })
})

describe('validación del hogar', () => {
  const valido: HogarEntrada = {
    jefeNombre: 'Rosa Ficticia',
    jefeRut: '12.345.678-5',
    whatsapp: '9 0000 1234',
    sectorId: '00000000-0000-4000-8000-000100000001',
    juntaVecinosId: null,
    direccion: 'Calle Larga 170',
    lat: null,
    lng: null,
    tenencia: 'propia',
    totalPersonas: 3,
    menores18: 1,
    bebesMenores2: 1,
    mayores65: 1,
    discapacidadOPostrados: null,
    embarazada: null,
    electrodependiente: null,
    mascotas: 0,
    ganadoTexto: null,
    contactoEmergenciaNombre: null,
    contactoEmergenciaTelefono: null,
    puntoEncuentro: null,
  }

  it('normaliza RUT y WhatsApp', () => {
    const r = hogarSchema.parse(valido)
    expect(r.jefeRut).toBe('12345678-5')
    expect(r.whatsapp).toBe('+56900001234')
  })

  it('acepta hogar sin RUT', () => {
    expect(hogarSchema.safeParse({ ...valido, jefeRut: null }).success).toBe(true)
  })

  it('rechaza conteos imposibles', () => {
    expect(hogarSchema.safeParse({ ...valido, bebesMenores2: 2 }).success).toBe(false)
    expect(hogarSchema.safeParse({ ...valido, menores18: 2, mayores65: 2 }).success).toBe(false)
  })

  it('acepta ubicación en Hualañé y rechaza la de otra ciudad', () => {
    expect(hogarSchema.safeParse({ ...valido, lat: -34.9766, lng: -71.8044 }).success).toBe(true)
    const concepcion = hogarSchema.safeParse({ ...valido, lat: -36.827, lng: -73.0503 })
    expect(concepcion.success).toBe(false)
    expect(concepcion.error?.issues[0]?.message).toMatch(/fuera de Hualañé/)
    expect(hogarSchema.safeParse({ ...valido, lat: -34.9766, lng: null }).success).toBe(false)
  })

  it('rechaza un RUT con dígito verificador incorrecto', () => {
    const r = hogarSchema.safeParse({ ...valido, jefeRut: '12.345.678-K' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0]?.message).toMatch(/dígito verificador/)
  })
})
