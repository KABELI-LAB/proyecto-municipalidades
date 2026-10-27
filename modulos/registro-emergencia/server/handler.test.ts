import { beforeEach, describe, expect, it } from 'vitest'
import type { InscripcionCreada, ResumenPublico, Territorio } from '../shared/contrato.ts'
import type { InscripcionEntrada } from '../shared/esquemas.ts'
import { handleEmergenciaRequest } from './handler.ts'
import { ConsoleProvider } from './mensajeria.ts'
import { crearRepoMemoria, type RepoMemoria } from './repoMemoria.ts'
import type { Contexto } from './servicio.ts'

let repo: RepoMemoria
let mensajeria: ConsoleProvider
let ctx: Contexto

beforeEach(() => {
  repo = crearRepoMemoria()
  mensajeria = new ConsoleProvider()
  ctx = { repo, mensajeria, ahora: () => new Date('2026-10-27T15:00:00Z'), urlBase: 'https://ejemplo.cl/emergencia' }
})

const llamar = (metodo: string, ruta: string, cuerpo?: unknown) =>
  handleEmergenciaRequest(
    new Request(`http://localhost/api/emergencia${ruta}`, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.7' },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    }),
    {},
    ctx,
  )

const inscripcion = (cambios: Partial<InscripcionEntrada['hogar']> = {}): InscripcionEntrada => ({
  hogar: {
    jefeNombre: 'Rosa Ficticia Prueba',
    jefeRut: '12.345.678-5',
    whatsapp: '9 0000 9999',
    sectorId: '00000000-0000-4000-8000-000100000002',
    direccion: 'Pasaje Uno 12',
    lat: null,
    lng: null,
    tenencia: 'propia',
    totalPersonas: 4,
    menores18: 2,
    bebesMenores2: 1,
    mayores65: 1,
    discapacidadOPostrados: null,
    embarazada: null,
    electrodependiente: true,
    mascotas: 2,
    ganadoTexto: null,
    contactoEmergenciaNombre: null,
    contactoEmergenciaTelefono: null,
    puntoEncuentro: null,
    ...cambios,
  },
  consentimiento: { acepta: true, version: 'x' },
  aceptaRecordatorios: true,
  origen: 'autorregistro',
})

describe('GET /territorio y /resumen', () => {
  it('entrega los sectores', async () => {
    const t = (await (await llamar('GET', '/territorio')).json()) as Territorio
    expect(t.sectores).toHaveLength(3)
  })

  it('oculta el contador bajo el mínimo', async () => {
    const r = (await (await llamar('GET', '/resumen')).json()) as ResumenPublico
    // El demo tiene 20 hogares (< 50).
    expect(r).toEqual({ hogaresPreparados: null })
  })
})

describe('POST /inscripcion', () => {
  it('crea un hogar con código único, token y consentimiento', async () => {
    const r = await llamar('POST', '/inscripcion', inscripcion())
    expect(r.status).toBe(201)
    const c = (await r.json()) as InscripcionCreada
    expect(c.hogar.codigoFamiliar).toMatch(/^FAM-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{2}$/)
    expect(c.hogar.nombreTarjeta).toBe('Familia Ficticia')
    expect(c.hogar.vigenteHasta).toBe('2027-04-27')
    expect(c.token.length).toBeGreaterThan(30)
    expect(repo.estado.consentimientos).toHaveLength(1)
    // El token se guarda solo como hash.
    expect(repo.estado.tokens[0]?.tokenHash).not.toBe(c.token)
    expect(repo.estado.tokens[0]?.tokenHash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('el plan familiar refleja el hogar (guagua → pañales, mascotas → alimento)', async () => {
    const c = (await (await llamar('POST', '/inscripcion', inscripcion())).json()) as InscripcionCreada
    const texto = c.hogar.plan.mochila.flatMap((g) => g.items).join(' ')
    expect(texto).toMatch(/Pañales/)
    expect(texto).toMatch(/alimento/)
    expect(c.hogar.plan.puntoEncuentro).toBe('Cancha de La Huerta')
  })

  it('no devuelve datos sensibles ni el RUT', async () => {
    const r = await llamar('POST', '/inscripcion', inscripcion())
    const texto = await r.text()
    expect(texto).not.toMatch(/electrodependiente|12345678|jefeRut|whatsapp/i)
  })

  it('un RUT repetido no duplica el hogar', async () => {
    await llamar('POST', '/inscripcion', inscripcion())
    const antes = repo.estado.hogares.length
    const r = await llamar('POST', '/inscripcion', inscripcion({ jefeNombre: 'Otra Persona' }))
    expect(r.status).toBe(409)
    expect(await r.json()).toMatchObject({ codigo: 'rut_existente' })
    expect(repo.estado.hogares.length).toBe(antes)
  })

  it('permite inscribir sin RUT con id provisorio', async () => {
    const r = await llamar('POST', '/inscripcion', inscripcion({ jefeRut: null }))
    expect(r.status).toBe(201)
  })

  it('valida en el servidor y responde por campo', async () => {
    const r = await llamar('POST', '/inscripcion', inscripcion({ jefeRut: '12.345.678-K', totalPersonas: 0 }))
    expect(r.status).toBe(400)
    const e = (await r.json()) as { campos: Record<string, string> }
    expect(Object.keys(e.campos)).toEqual(expect.arrayContaining(['jefeRut', 'totalPersonas']))
  })

  it('exige el consentimiento', async () => {
    const r = await llamar('POST', '/inscripcion', { ...inscripcion(), consentimiento: { acepta: false, version: 'x' } })
    expect(r.status).toBe(400)
  })

  it('envía la tarjeta por WhatsApp con el link en el fragmento (#), no en la ruta', async () => {
    await llamar('POST', '/inscripcion', inscripcion())
    expect(mensajeria.enviados).toHaveLength(1)
    expect(mensajeria.enviados[0]).toMatchObject({ plantilla: 'tarjeta_activada', to: '+56900009999' })
    expect(mensajeria.enviados[0]?.params.link).toMatch(/\/mi-hogar#t=/)
  })

  it('limita los intentos por IP', async () => {
    for (let i = 0; i < 20; i++) await llamar('POST', '/inscripcion', { basura: true })
    const r = await llamar('POST', '/inscripcion', inscripcion())
    expect(r.status).toBe(429)
  })
})

describe('POST /mi-hogar', () => {
  it('devuelve el hogar con un token válido y rechaza otros', async () => {
    const c = (await (await llamar('POST', '/inscripcion', inscripcion())).json()) as InscripcionCreada
    const ok = await llamar('POST', '/mi-hogar', { token: c.token })
    expect(ok.status).toBe(200)
    expect(((await ok.json()) as { codigoFamiliar: string }).codigoFamiliar).toBe(c.hogar.codigoFamiliar)

    expect((await llamar('POST', '/mi-hogar', { token: 'x'.repeat(43) })).status).toBe(401)
    expect((await llamar('POST', '/mi-hogar', { token: '../../etc' })).status).toBe(401)
  })
})

it('responde 503 si no hay base configurada', async () => {
  const r = await handleEmergenciaRequest(new Request('http://localhost/api/emergencia/resumen'), {}, null)
  expect(r.status).toBe(503)
})
