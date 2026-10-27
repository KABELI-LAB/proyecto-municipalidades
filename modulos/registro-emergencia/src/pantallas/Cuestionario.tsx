import { Alert, Button, Icon, Loader } from '@muni/design-system'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import type { Territorio } from '../../shared/contrato.ts'
import type { Tenencia } from '../../shared/esquemas.ts'
import { formatearRut } from '../../shared/rut.ts'
import { formatearCelular, normalizarCelular } from '../../shared/telefono.ts'
import { CONSENTIMIENTO, RECORDATORIOS } from '../../shared/textos.ts'
import { dentroDeHualane, MENSAJE_FUERA } from '../../shared/ubicacion.ts'
import { CasaEnVivo } from '../componentes/CasaEnVivo'
import { Campo, CampoRut, Contador, OpcionMultiple, Opciones } from '../componentes/controles'
import { InterruptorMovimiento } from '../componentes/InterruptorMovimiento'
import { TarjetaHogar } from '../componentes/TarjetaHogar'
import { CLAVES, borrar, guardar, leer } from '../lib/almacen'
import { aInscripcion, ajustarConteos, BORRADOR_VACIO, validar, type Borrador } from '../lib/borrador'
import { useEmergencia } from '../lib/contexto'
import { ruta } from '../lib/rutas'
import { ApiError } from '../servicios/api'
import s from '../styles/cuestionario.module.css'

const MapaUbicacion = lazy(() => import('../componentes/MapaUbicacion'))

type Bloque = 'datos' | 'ubicacion' | 'hogar' | 'cierre'

const BLOQUES: { id: Bloque; hito: string; celebracion: string }[] = [
  { id: 'datos', hito: 'Datos de contacto', celebracion: 'Listo, ya sabemos cómo contactarte.' },
  { id: 'ubicacion', hito: 'Ubicación lista', celebracion: 'Listo, tu hogar ya tiene ubicación.' },
  { id: 'hogar', hito: 'Hogar completo', celebracion: 'Listo, tu hogar está completo.' },
  { id: 'cierre', hito: 'Tarjeta lista para activar', celebracion: '' },
]

type IdPaso =
  | 'nombre' | 'rut' | 'whatsapp'
  | 'sector' | 'direccion'
  | 'tenencia' | 'personas' | 'menores' | 'bebes' | 'mayores' | 'especiales' | 'mascotas' | 'animales'
  | 'contacto' | 'encuentro' | 'resumen' | 'activar'

interface Paso {
  id: IdPaso
  bloque: Bloque
  visible?: (b: Borrador) => boolean
  error?: (b: Borrador) => string | null
}

const PASOS: Paso[] = [
  { id: 'nombre', bloque: 'datos', error: validar.nombre },
  { id: 'rut', bloque: 'datos', error: validar.rut },
  { id: 'whatsapp', bloque: 'datos', error: validar.whatsapp },
  { id: 'sector', bloque: 'ubicacion', error: (b) => (b.sectorId ? null : 'Elige tu sector.') },
  { id: 'direccion', bloque: 'ubicacion', error: validar.direccion },
  { id: 'tenencia', bloque: 'hogar', error: (b) => (b.tenencia ? null : 'Elige una opción.') },
  { id: 'personas', bloque: 'hogar' },
  { id: 'menores', bloque: 'hogar', visible: (b) => b.totalPersonas > 0 },
  { id: 'bebes', bloque: 'hogar', visible: (b) => b.menores18 > 0 },
  { id: 'mayores', bloque: 'hogar', visible: (b) => b.totalPersonas - b.menores18 > 0 },
  { id: 'especiales', bloque: 'hogar' },
  { id: 'mascotas', bloque: 'hogar' },
  { id: 'animales', bloque: 'hogar', error: (b) => (b.tieneAnimales === null ? 'Elige sí o no.' : null) },
  { id: 'contacto', bloque: 'cierre', error: validar.contacto },
  { id: 'encuentro', bloque: 'cierre' },
  { id: 'resumen', bloque: 'cierre' },
  { id: 'activar', bloque: 'cierre', error: (b) => (b.consentimiento ? null : 'Sin tu autorización no podemos crear tu tarjeta. Marca la casilla para continuar.') },
]

/** Pasos que avanzan solos al elegir una opción. */
const AUTO_AVANCE: IdPaso[] = ['sector', 'tenencia', 'animales']
const SEGUNDOS_POR_PASO = 7

/** Campo del servidor → paso donde se corrige. */
const PASO_DE_CAMPO: Record<string, IdPaso> = {
  jefeNombre: 'nombre',
  jefeRut: 'rut',
  whatsapp: 'whatsapp',
  sectorId: 'sector',
  direccion: 'direccion',
  lat: 'direccion',
  totalPersonas: 'personas',
  menores18: 'menores',
  bebesMenores2: 'bebes',
  mayores65: 'mayores',
  contactoEmergenciaTelefono: 'contacto',
}

interface Guardado {
  borrador: Borrador
  paso: IdPaso
}

type Envio = { estado: 'inactivo' } | { estado: 'enviando' } | { estado: 'error'; mensaje: string; rutExiste?: boolean }

export function Cuestionario() {
  const { api, menosMovimiento: menosMovSistema } = useEmergencia()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const asistido = params.get('modo') === 'asistido'
  const menosMovimiento = menosMovSistema || asistido

  const [territorio, setTerritorio] = useState<Territorio | null>(null)
  const [errorCarga, setErrorCarga] = useState(false)
  const [b, setB] = useState<Borrador>(BORRADOR_VACIO)
  const [pasoId, setPasoId] = useState<IdPaso>('nombre')
  const [pendiente, setPendiente] = useState<Guardado | null>(() => {
    const g = leer<Guardado>(CLAVES.borrador)
    return g && g.paso !== 'nombre' ? g : null
  })
  const [intento, setIntento] = useState(false)
  const [celebracion, setCelebracion] = useState<string | null>(null)
  const [desdeResumen, setDesdeResumen] = useState(false)
  const [envio, setEnvio] = useState<Envio>({ estado: 'inactivo' })
  const [direccionAnim, setDireccionAnim] = useState<'adelante' | 'atras'>('adelante')
  const tituloRef = useRef<HTMLHeadingElement>(null)
  const primerRender = useRef(true)
  const sesion = useMemo(() => {
    const previa = leer<string>(CLAVES.sesion)
    if (previa) return previa
    const nueva = globalThis.crypto.randomUUID()
    guardar(CLAVES.sesion, nueva)
    return nueva
  }, [])

  const pedirTerritorio = useCallback(() => {
    api.territorio().then(setTerritorio, () => setErrorCarga(true))
  }, [api])
  useEffect(pedirTerritorio, [pedirTerritorio])
  const cargarTerritorio = () => {
    setErrorCarga(false)
    pedirTerritorio()
  }

  const visibles = useMemo(() => PASOS.filter((p) => !p.visible || p.visible(b)), [b])
  const indice = Math.max(0, visibles.findIndex((p) => p.id === pasoId))
  const paso = visibles[indice] ?? visibles[0]!
  const errorPaso = intento ? (paso.error?.(b) ?? null) : null

  // Guardado automático del avance (sessionStorage: equipos compartidos).
  useEffect(() => {
    if (pendiente) return
    guardar(CLAVES.borrador, { borrador: b, paso: pasoId } satisfies Guardado)
  }, [b, pasoId, pendiente])

  // Foco en la pregunta y métrica de vista al cambiar de paso.
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false
    } else {
      tituloRef.current?.focus()
    }
    api.evento(sesion, paso.id, 'vista')
  }, [paso.id, api, sesion])

  // Abandono: al cerrar la página sin enviar.
  useEffect(() => {
    const salir = () => api.evento(sesion, paso.id, 'abandono')
    window.addEventListener('pagehide', salir)
    return () => window.removeEventListener('pagehide', salir)
  }, [api, sesion, paso.id])

  const actualizar = (cambios: Partial<Borrador>) => setB((prev) => ajustarConteos({ ...prev, ...cambios }))

  const irA = (id: IdPaso, dir: 'adelante' | 'atras' = 'adelante') => {
    setIntento(false)
    setDireccionAnim(dir)
    setPasoId(id)
  }

  const siguiente = (borrador: Borrador = b) => {
    const p = visibles.find((x) => x.id === pasoId) ?? paso
    if (p.error?.(borrador)) {
      setIntento(true)
      return
    }
    api.evento(sesion, p.id, 'completado')
    const lista = PASOS.filter((x) => !x.visible || x.visible(borrador))
    const i = lista.findIndex((x) => x.id === p.id)
    if (desdeResumen) {
      setDesdeResumen(false)
      irA('resumen')
      return
    }
    const prox = lista[i + 1]
    if (!prox) return
    if (prox.bloque !== p.bloque) {
      const frase = BLOQUES.find((x) => x.id === p.bloque)?.celebracion
      if (frase) setCelebracion(frase)
    } else {
      setCelebracion(null)
    }
    irA(prox.id)
  }

  const atras = () => {
    setCelebracion(null)
    if (desdeResumen) {
      setDesdeResumen(false)
      irA('resumen', 'atras')
      return
    }
    const prev = visibles[indice - 1]
    if (prev) irA(prev.id, 'atras')
  }

  /** Opción única: guarda y avanza tras una pausa breve para ver la selección. */
  const elegirYAvanzar = (cambios: Partial<Borrador>, avanzar = true) => {
    const nuevo = ajustarConteos({ ...b, ...cambios })
    setB(nuevo)
    if (avanzar && AUTO_AVANCE.includes(pasoId)) setTimeout(() => siguiente(nuevo), menosMovimiento ? 0 : 220)
  }

  const cambiarDesdeResumen = (id: IdPaso) => {
    setDesdeResumen(true)
    irA(id, 'atras')
  }

  const enviar = async () => {
    if (paso.error?.(b)) {
      setIntento(true)
      return
    }
    setEnvio({ estado: 'enviando' })
    try {
      const creada = await api.inscribir(aInscripcion(b, asistido ? 'asistido' : 'autorregistro'))
      api.evento(sesion, 'activar', 'enviado')
      guardar(CLAVES.resultado, creada)
      borrar(CLAVES.borrador)
      borrar(CLAVES.sesion)
      navigate(ruta('listo'))
    } catch (err) {
      if (err instanceof ApiError && err.codigo === 'rut_existente') {
        setEnvio({ estado: 'error', mensaje: err.message, rutExiste: true })
        return
      }
      if (err instanceof ApiError && err.codigo === 'validacion') {
        const [campo, mensaje] = Object.entries(err.campos)[0] ?? []
        const destino = campo ? PASO_DE_CAMPO[campo] : undefined
        if (destino) {
          setEnvio({ estado: 'inactivo' })
          setDesdeResumen(true)
          irA(destino, 'atras')
          setIntento(true)
          return
        }
        setEnvio({ estado: 'error', mensaje: mensaje ?? err.message })
        return
      }
      setEnvio({ estado: 'error', mensaje: err instanceof Error ? err.message : 'Tuvimos un problema. Inténtalo de nuevo.' })
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (paso.id === 'activar') void enviar()
    else siguiente()
  }

  // ── Derivados para el panel "Tu hogar" ─────────────────────────────────────
  const sector = territorio?.sectores.find((x) => x.id === b.sectorId) ?? null
  // La casa y la tarjeta se arman en vivo: un dato aparece desde que su pregunta está en pantalla.
  const alcanzado = (id: IdPaso) => PASOS.findIndex((p) => p.id === id) <= PASOS.findIndex((p) => p.id === paso.id)
  const respondido = (id: IdPaso) => PASOS.findIndex((p) => p.id === id) < PASOS.findIndex((p) => p.id === paso.id)
  const adultos = alcanzado('personas') ? b.totalPersonas - b.menores18 - b.mayores65 : 0
  const restantes = visibles.length - indice - 1
  const bloqueActual = BLOQUES.findIndex((x) => x.id === paso.bloque)

  if (pendiente) {
    return (
      <div className={s.retomar}>
        <h1 tabIndex={-1} className={s.pregunta}>
          ¿Seguimos donde quedaste?
        </h1>
        <p>Guardamos tus respuestas en este dispositivo mientras la pestaña siga abierta.</p>
        <div className={s.acciones}>
          <Button
            variant="primary"
            size="lg"
            iconRight="arrow-right"
            onClick={() => {
              setB(ajustarConteos({ ...BORRADOR_VACIO, ...pendiente.borrador }))
              setPasoId(pendiente.paso)
              setPendiente(null)
            }}
          >
            Seguir donde quedé
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              borrar(CLAVES.borrador)
              setPendiente(null)
            }}
          >
            Empezar de nuevo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${s.raiz} ${asistido ? s.asistido : ''} ${menosMovimiento ? s.quieto : ''}`}>
      <BarraDesbloqueo bloqueActual={bloqueActual} />

      <div className={s.layout}>
        <aside className={s.panel} aria-label="Tu hogar">
          <p className={s.panelTitulo}>Tu hogar</p>
          <div className={s.panelContenido}>
            <CasaEnVivo
              adultos={Math.max(0, adultos)}
              menores={b.menores18}
              bebes={b.bebesMenores2}
              mayores={b.mayores65}
              mascotas={b.mascotas}
              animales={b.tieneAnimales === true}
              conUbicacion={respondido('direccion') || b.lat !== null}
            />
            <div className={s.panelTarjeta}>
              <TarjetaHogar
                previa
                datos={{
                  nombre: b.jefeNombre.trim() ? `Familia de ${b.jefeNombre.trim().split(/\s+/)[0]}` : null,
                  direccion: b.direccion.trim() || null,
                  integrantes: alcanzado('personas') ? b.totalPersonas : null,
                }}
              />
            </div>
          </div>
        </aside>

        <form className={s.formulario} onSubmit={onSubmit} noValidate>
          <div className={s.meta}>
            <span aria-live="polite">
              Pregunta {indice + 1} de {visibles.length}
            </span>
            <span>{tiempoRestante(restantes)}</span>
          </div>

          {celebracion && (
            <p className={s.celebracion} role="status">
              <span className={s.celebracionCheck}>
                <Icon name="check" size={18} />
              </span>
              {celebracion}
            </p>
          )}

          {!territorio && !errorCarga && <Loader label="Cargando…" />}
          {errorCarga && (
            <Alert tone="error" title="No pudimos cargar los sectores" action={<Button variant="secondary" onClick={cargarTerritorio}>Reintentar</Button>}>
              Revisa tu conexión e inténtalo de nuevo.
            </Alert>
          )}

          {territorio && (
            <div key={paso.id} className={s.pasoAnim} data-dir={direccionAnim}>
              <ContenidoPaso
                paso={paso.id}
                b={b}
                actualizar={actualizar}
                elegir={elegirYAvanzar}
                error={errorPaso}
                intento={intento}
                territorio={territorio}
                tituloRef={tituloRef}
                menosMovimiento={menosMovimiento}
                puntoSugerido={sector?.puntoEncuentroSugerido ?? null}
                onCambiar={cambiarDesdeResumen}
              />
            </div>
          )}

          {envio.estado === 'error' && (
            <Alert tone={envio.rutExiste ? 'info' : 'error'} title={envio.mensaje}>
              {envio.rutExiste ? (
                <>
                  Te enviamos la tarjeta a tu WhatsApp registrado desde <Link to={ruta('recuperar')}>Perdí mi código</Link>.
                </>
              ) : (
                'Revisa tu conexión e inténtalo de nuevo.'
              )}
            </Alert>
          )}

          <div className={s.navegacion}>
            {indice > 0 && (
              <Button variant="ghost" size="lg" iconLeft="arrow-left" onClick={atras}>
                Atrás
              </Button>
            )}
            {/* En opción única el botón aparece al elegir (para quien usa teclado). */}
            {(!AUTO_AVANCE.includes(paso.id) || !paso.error?.(b)) &&
              (paso.id === 'activar' ? (
                <Button type="submit" variant="primary" size="lg" iconRight="credit-card" loading={envio.estado === 'enviando'} block>
                  Activar mi tarjeta
                </Button>
              ) : (
                <Button type="submit" variant="primary" size="lg" iconRight="arrow-right" block>
                  {desdeResumen ? 'Volver al resumen' : textoSiguiente(paso.id, b)}
                </Button>
              ))}
          </div>

          <div className={s.pieFormulario}>
            <InterruptorMovimiento />
            {asistido && <span className={s.etiquetaAsistido}>Modo asistido</span>}
          </div>
        </form>
      </div>
    </div>
  )
}

function textoSiguiente(paso: IdPaso, b: Borrador): string {
  if (paso === 'especiales' && !b.especiales.ninguna && !b.especiales.noResponde && !b.especiales.discapacidad && !b.especiales.embarazada && !b.especiales.electrodependiente)
    return 'Saltar esta pregunta'
  if (paso === 'contacto' && !b.contactoNombre.trim() && !b.contactoTelefono.trim()) return 'Saltar por ahora'
  if (paso === 'encuentro' && !b.puntoEncuentro.trim()) return 'Usar el punto sugerido'
  if (paso === 'resumen') return 'Todo está bien'
  return 'Siguiente'
}

function tiempoRestante(pasos: number): string {
  const seg = pasos * SEGUNDOS_POR_PASO
  if (seg <= 0) return 'Último paso'
  if (seg < 60) return `Quedan unos ${Math.max(10, Math.round(seg / 10) * 10)} segundos`
  const min = Math.round(seg / 60)
  return min <= 1 ? 'Queda cerca de un minuto' : `Quedan unos ${min} minutos`
}

// ── Barra de progreso = barra de desbloqueo ──────────────────────────────────

function BarraDesbloqueo({ bloqueActual }: { bloqueActual: number }) {
  const faltan = BLOQUES.length - 1 - bloqueActual
  return (
    <div className={s.desbloqueo}>
      <p className={s.desbloqueoTitulo}>
        <Icon name={faltan === 0 ? 'credit-card' : 'lock'} size={18} />
        {faltan === 0 ? 'Último paso para activar tu tarjeta' : `${faltan + 1} pasos para activar tu tarjeta`}
      </p>
      <ol className={s.hitos}>
        {BLOQUES.map((bl, i) => {
          const estado = i < bloqueActual ? 'listo' : i === bloqueActual ? 'actual' : 'pendiente'
          return (
            <li key={bl.id} className={s.hito} data-estado={estado}>
              <span className={s.hitoBarra} />
              <span className={s.hitoTexto}>
                {estado === 'listo' && <Icon name="check" size={14} />}
                {bl.hito}
                <span className={s.srOnly}>{estado === 'listo' ? ' (listo)' : estado === 'actual' ? ' (en curso)' : ''}</span>
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

// ── Contenido de cada pregunta ───────────────────────────────────────────────

interface ContenidoProps {
  paso: IdPaso
  b: Borrador
  actualizar: (c: Partial<Borrador>) => void
  elegir: (c: Partial<Borrador>, avanzar?: boolean) => void
  error: string | null
  intento: boolean
  territorio: Territorio
  tituloRef: React.RefObject<HTMLHeadingElement | null>
  menosMovimiento: boolean
  puntoSugerido: string | null
  onCambiar: (id: IdPaso) => void
}

function Pregunta({ titulo, ayuda, tituloRef, children, porque }: { titulo: string; ayuda?: ReactNode; porque?: string; tituloRef: ContenidoProps['tituloRef']; children: ReactNode }) {
  return (
    <div className={s.paso}>
      <h1 ref={tituloRef} tabIndex={-1} className={s.pregunta}>
        {titulo}
      </h1>
      {ayuda && <p className={s.ayudaPregunta}>{ayuda}</p>}
      {porque && (
        <p className={s.porque}>
          <Icon name="info" size={20} />
          {porque}
        </p>
      )}
      {children}
    </div>
  )
}

function ErrorPaso({ error }: { error: string | null }) {
  return error ? (
    <p className="hds-error-msg" role="alert">
      <Icon name="circle-alert" size={18} />
      {error}
    </p>
  ) : null
}

function ContenidoPaso(p: ContenidoProps) {
  const { b, actualizar, elegir, error, tituloRef, territorio } = p
  const nombre = b.jefeNombre.trim().split(/\s+/)[0] ?? ''

  switch (p.paso) {
    case 'nombre':
      return (
        <Pregunta titulo="¿Cómo se llama el jefe o jefa de hogar?" ayuda="La persona responsable de la casa. Puedes ser tú." tituloRef={tituloRef}>
          <Campo id="re-nombre" etiqueta="Nombre y apellidos" valor={b.jefeNombre} onChange={(v) => actualizar({ jefeNombre: v })} autoComplete="name" error={error} maxLength={120} />
        </Pregunta>
      )

    case 'rut':
      return (
        <Pregunta titulo={`¿Cuál es el RUT de ${nombre || 'esa persona'}?`} ayuda="Lo usamos para encontrar a tu familia rápido en una emergencia, aunque pierdas la tarjeta." tituloRef={tituloRef}>
          {b.sinRut ? (
            <div className={s.sinRut}>
              <p>Te inscribiremos con un número provisorio. Cuando tengas RUT, puedes agregarlo.</p>
              <Button variant="tertiary" onClick={() => actualizar({ sinRut: false })}>
                Sí tengo RUT
              </Button>
            </div>
          ) : (
            <>
              <CampoRut id="re-rut" valor={b.rut} onChange={(v) => actualizar({ rut: v })} intentoAvanzar={p.intento} />
              <Button variant="tertiary" onClick={() => actualizar({ sinRut: true, rut: '' })}>
                No tengo RUT
              </Button>
            </>
          )}
        </Pregunta>
      )

    case 'whatsapp':
      return (
        <Pregunta titulo="¿A qué WhatsApp te escribimos?" ayuda="Ahí te enviamos tu tarjeta y un recordatorio cada 6 meses. Nada más." tituloRef={tituloRef}>
          <Campo
            id="re-whatsapp"
            etiqueta="Celular con WhatsApp"
            ayuda="9 dígitos. Ej: 9 1234 5678"
            tipo="tel"
            inputMode="tel"
            autoComplete="tel-national"
            valor={b.whatsapp}
            onChange={(v) => actualizar({ whatsapp: v })}
            error={error}
            placeholder="9 1234 5678"
            maxLength={16}
          />
        </Pregunta>
      )

    case 'sector':
      return (
        <Pregunta titulo="¿En qué sector vives?" tituloRef={tituloRef}>
          <Opciones
            nombre="sector"
            etiquetaGrupo="Sector"
            valor={b.sectorId}
            onElegir={(v, avanzar) => elegir({ sectorId: v }, avanzar)}
            opciones={territorio.sectores.map((x) => ({ valor: x.id, etiqueta: x.nombre, icono: 'map-pin' }))}
          />
          <ErrorPaso error={error} />
        </Pregunta>
      )

    case 'direccion':
      return <PasoDireccion {...p} />

    case 'tenencia':
      return (
        <Pregunta titulo="¿La casa es propia, arrendada, cedida o vives como allegado?" tituloRef={tituloRef}>
          <Opciones<Tenencia>
            nombre="tenencia"
            etiquetaGrupo="Tenencia de la casa"
            valor={b.tenencia}
            onElegir={(v, avanzar) => elegir({ tenencia: v }, avanzar)}
            columnas={2}
            opciones={[
              { valor: 'propia', etiqueta: 'Propia', icono: 'house' },
              { valor: 'arrendada', etiqueta: 'Arrendada', icono: 'wallet' },
              { valor: 'cedida', etiqueta: 'Cedida', descripcion: 'Te la prestan', icono: 'hand-heart' },
              { valor: 'allegados', etiqueta: 'Allegados', descripcion: 'Vives en casa de otra familia', icono: 'users' },
            ]}
          />
          <ErrorPaso error={error} />
        </Pregunta>
      )

    case 'personas':
      return (
        <Pregunta titulo="¿Cuántas personas viven en la casa?" tituloRef={tituloRef}>
          <Contador etiqueta="Personas" ayuda="Contándote a ti" valor={b.totalPersonas} min={1} max={30} onChange={(v) => actualizar({ totalPersonas: v })} />
        </Pregunta>
      )

    case 'menores':
      return (
        <Pregunta titulo="¿Cuántas son menores de 18 años?" ayuda="Si no hay, deja el 0." tituloRef={tituloRef}>
          <Contador etiqueta="Menores de 18" valor={b.menores18} max={b.totalPersonas} onChange={(v) => actualizar({ menores18: v })} />
        </Pregunta>
      )

    case 'bebes':
      return (
        <Pregunta titulo="¿Alguna es guagua menor de 2 años?" ayuda="Así sumamos pañales y leche a tu plan de emergencia." tituloRef={tituloRef}>
          <Contador etiqueta="Menores de 2 años" valor={b.bebesMenores2} max={b.menores18} onChange={(v) => actualizar({ bebesMenores2: v })} />
        </Pregunta>
      )

    case 'mayores':
      return (
        <Pregunta titulo="¿Cuántas son mayores de 65 años?" ayuda="Si no hay, deja el 0." tituloRef={tituloRef}>
          <Contador etiqueta="Mayores de 65" valor={b.mayores65} max={b.totalPersonas - b.menores18} onChange={(v) => actualizar({ mayores65: v })} />
        </Pregunta>
      )

    case 'especiales':
      return <PasoEspeciales {...p} />

    case 'mascotas':
      return (
        <Pregunta titulo="¿Tienen mascotas?" ayuda="Perros, gatos u otros animales que viven con ustedes. Si no hay, deja el 0." tituloRef={tituloRef}>
          <Contador etiqueta="Mascotas" valor={b.mascotas} max={50} onChange={(v) => actualizar({ mascotas: v })} />
        </Pregunta>
      )

    case 'animales':
      return (
        <Pregunta titulo="¿Tienen ganado u otros animales de campo?" ayuda="Vacas, caballos, gallinas, ovejas…" tituloRef={tituloRef}>
          <Opciones
            nombre="animales"
            etiquetaGrupo="Ganado u otros animales"
            valor={b.tieneAnimales === null ? null : b.tieneAnimales ? 'si' : 'no'}
            onElegir={(v, avanzar) => (v === 'no' ? elegir({ tieneAnimales: false, ganadoTexto: '' }, avanzar) : actualizar({ tieneAnimales: true }))}
            columnas={2}
            opciones={[
              { valor: 'si', etiqueta: 'Sí', icono: 'wheat' },
              { valor: 'no', etiqueta: 'No', icono: 'x' },
            ]}
          />
          {b.tieneAnimales && (
            <>
              <Campo id="re-ganado" etiqueta="¿Qué animales y cuántos?" ayuda='Ej: "4 vacas, 10 gallinas"' valor={b.ganadoTexto} onChange={(v) => actualizar({ ganadoTexto: v })} maxLength={200} opcional />
            </>
          )}
          <ErrorPaso error={error} />
        </Pregunta>
      )

    case 'contacto':
      return (
        <Pregunta titulo="¿A quién llamamos si no te encontramos?" ayuda="Alguien de confianza que no viva en tu casa." tituloRef={tituloRef}>
          <Campo id="re-contacto-nombre" etiqueta="Nombre" valor={b.contactoNombre} onChange={(v) => actualizar({ contactoNombre: v })} opcional maxLength={120} />
          <Campo
            id="re-contacto-tel"
            etiqueta="Celular"
            tipo="tel"
            inputMode="tel"
            valor={b.contactoTelefono}
            onChange={(v) => actualizar({ contactoTelefono: v })}
            error={error}
            opcional
            placeholder="9 1234 5678"
            maxLength={16}
          />
        </Pregunta>
      )

    case 'encuentro':
      return (
        <Pregunta
          titulo="Si tienen que salir de la casa, ¿dónde se juntan?"
          ayuda={p.puntoSugerido ? `Si no eliges uno, te sugerimos: ${p.puntoSugerido}.` : 'Un lugar seguro y conocido por todos.'}
          tituloRef={tituloRef}
        >
          <Campo id="re-encuentro" etiqueta="Punto de encuentro" valor={b.puntoEncuentro} onChange={(v) => actualizar({ puntoEncuentro: v })} opcional placeholder="Ej: la plaza, la casa de la abuela" maxLength={200} />
        </Pregunta>
      )

    case 'resumen':
      return <PasoResumen {...p} />

    case 'activar':
      return (
        <Pregunta titulo="Activa tu Tarjeta Hogar Preparado" tituloRef={tituloRef}>
          <div className={s.consentimiento}>
            {CONSENTIMIENTO.texto.split('\n').map((linea) => (
              <p key={linea}>{linea}</p>
            ))}
          </div>
          <p className={s.ayuda}>Para tener tu tarjeta necesitamos tu autorización. Sin ella no podemos crearla.</p>
          <OpcionMultiple etiqueta="Acepto que guarden los datos de mi hogar (obligatorio)" marcada={b.consentimiento} onChange={(v) => actualizar({ consentimiento: v })} icono="shield-check" />
          <OpcionMultiple etiqueta="Recordatorios por WhatsApp" descripcion={RECORDATORIOS} marcada={b.recordatorios} onChange={(v) => actualizar({ recordatorios: v })} icono="message-circle" />
          <ErrorPaso error={error} />
        </Pregunta>
      )
  }
}

function PasoDireccion({ b, actualizar, tituloRef, error, menosMovimiento }: ContenidoProps) {
  const [verMapa, setVerMapa] = useState(b.lat !== null)
  const [ubicando, setUbicando] = useState(false)
  const [avisoGeo, setAvisoGeo] = useState<string | null>(null)
  // Cambia con cada lectura del GPS para que el mapa se centre en ella.
  const [enfocar, setEnfocar] = useState(0)

  const usarUbicacion = () => {
    setAvisoGeo(null)
    setVerMapa(true)
    if (!('geolocation' in navigator)) {
      setAvisoGeo('Tu teléfono no comparte la ubicación. Toca tu casa en el mapa.')
      return
    }
    setUbicando(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUbicando(false)
        const { latitude: lat, longitude: lng, accuracy } = pos.coords
        if (!dentroDeHualane(lat, lng)) {
          setAvisoGeo('Tu ubicación actual está fuera de Hualañé. Si no estás en tu casa, tócala en el mapa o deja solo la dirección.')
          return
        }
        actualizar({ lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 })
        setEnfocar((n) => n + 1)
        if (accuracy > 150) setAvisoGeo('Tu ubicación es aproximada. Arrastra el pin hasta tu casa.')
      },
      (err) => {
        setUbicando(false)
        setAvisoGeo(
          err.code === err.PERMISSION_DENIED
            ? 'No diste permiso para usar tu ubicación. Toca tu casa en el mapa.'
            : 'No pudimos obtener tu ubicación. Toca tu casa en el mapa.',
        )
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    )
  }

  return (
    <Pregunta titulo="¿Dónde vives?" ayuda="Escribe la dirección o una referencia para llegar." tituloRef={tituloRef}>
      <Campo id="re-direccion" etiqueta="Dirección" valor={b.direccion} onChange={(v) => actualizar({ direccion: v })} autoComplete="street-address" error={error} placeholder="Ej: Pasaje Los Aromos 123" maxLength={200} />
      <div className={s.accionesUbicacion}>
        <Button variant="secondary" iconLeft="locate-fixed" loading={ubicando} onClick={usarUbicacion}>
          Usar mi ubicación
        </Button>
        {!verMapa && (
          <Button variant="tertiary" iconLeft="map" onClick={() => setVerMapa(true)}>
            Marcar en el mapa
          </Button>
        )}
        {b.lat !== null && (
          <Button variant="ghost" iconLeft="x" onClick={() => actualizar({ lat: null, lng: null })}>
            Quitar ubicación
          </Button>
        )}
      </div>
      {avisoGeo && (
        <p className={s.avisoGeo} role="status">
          <Icon name="info" size={20} />
          {avisoGeo}
        </p>
      )}
      {verMapa && (
        <Suspense fallback={<Loader label="Cargando mapa…" />}>
          <MapaUbicacion
            lat={b.lat}
            lng={b.lng}
            onChange={(lat, lng) => {
              setAvisoGeo(null)
              actualizar({ lat, lng })
            }}
            onFuera={() => setAvisoGeo(MENSAJE_FUERA)}
            enfocar={enfocar}
            menosMovimiento={menosMovimiento}
          />
          <p className={s.ayuda}>{b.lat !== null ? 'Listo. Toca otro punto o arrastra el pin si no quedó justo en tu casa.' : 'Toca tu casa en el mapa. Es opcional.'}</p>
        </Suspense>
      )}
    </Pregunta>
  )
}

function PasoEspeciales({ b, actualizar, tituloRef }: ContenidoProps) {
  const e = b.especiales
  const set = (c: Partial<Borrador['especiales']>) => {
    const nuevo = { ...e, ...c }
    // Marcar una situación desmarca "Ninguna" y "Prefiero no responder", y viceversa.
    if (c.discapacidad || c.embarazada || c.electrodependiente) Object.assign(nuevo, { ninguna: false, noResponde: false })
    if (c.ninguna || c.noResponde) Object.assign(nuevo, { discapacidad: 0, embarazada: false, electrodependiente: false, ninguna: !!c.ninguna, noResponde: !!c.noResponde })
    actualizar({ especiales: nuevo })
  }
  return (
    <Pregunta
      titulo="¿Hay alguna situación especial en tu hogar?"
      ayuda="Es opcional. Puedes marcar más de una. No cambia tus beneficios."
      porque="Nos ayuda a llegar primero donde hay personas que no pueden moverse solas o dependen de la electricidad."
      tituloRef={tituloRef}
    >
      <OpcionMultiple etiqueta="Persona con discapacidad o postrada" icono="accessibility" marcada={e.discapacidad > 0} onChange={(v) => set({ discapacidad: v ? 1 : 0 })}>
        <div className={s.subcontador}>
          <Contador etiqueta="¿Cuántas personas?" valor={e.discapacidad} min={1} max={b.totalPersonas} onChange={(v) => set({ discapacidad: v })} />
        </div>
      </OpcionMultiple>
      <OpcionMultiple etiqueta="Embarazada" icono="baby" marcada={e.embarazada} onChange={(v) => set({ embarazada: v })} />
      <OpcionMultiple etiqueta="Electrodependiente" descripcion="Necesita electricidad para un equipo médico" icono="heart-pulse" marcada={e.electrodependiente} onChange={(v) => set({ electrodependiente: v })} />
      <OpcionMultiple etiqueta="Ninguna" marcada={e.ninguna} onChange={(v) => set({ ninguna: v })} />
      <OpcionMultiple etiqueta="Prefiero no responder" marcada={e.noResponde} onChange={(v) => set({ noResponde: v })} />
    </Pregunta>
  )
}

function PasoResumen({ b, territorio, tituloRef, onCambiar }: ContenidoProps) {
  const sector = territorio.sectores.find((x) => x.id === b.sectorId)?.nombre
  const tenencia = { propia: 'Propia', arrendada: 'Arrendada', cedida: 'Cedida', allegados: 'Allegados' }[b.tenencia ?? 'propia']
  const e = b.especiales
  const especiales = e.noResponde
    ? 'Prefiere no responder'
    : [e.discapacidad > 0 && `Discapacidad o postrados: ${e.discapacidad}`, e.embarazada && 'Embarazada', e.electrodependiente && 'Electrodependiente'].filter(Boolean).join(' · ') || 'Ninguna'
  const filas: { titulo: string; valor: string; paso: IdPaso }[] = [
    { titulo: 'Jefe o jefa de hogar', valor: b.jefeNombre, paso: 'nombre' },
    { titulo: 'RUT', valor: b.sinRut ? 'Sin RUT (número provisorio)' : formatearRut(b.rut), paso: 'rut' },
    { titulo: 'WhatsApp', valor: formatearCelular(normalizarCelular(b.whatsapp) ?? b.whatsapp), paso: 'whatsapp' },
    { titulo: 'Sector', valor: sector ?? '', paso: 'sector' },
    { titulo: 'Dirección', valor: b.direccion + (b.lat !== null ? ' (marcada en el mapa)' : ''), paso: 'direccion' },
    { titulo: 'Casa', valor: tenencia, paso: 'tenencia' },
    {
      titulo: 'Personas',
      valor: `${b.totalPersonas} en total · ${b.menores18} menores de 18${b.bebesMenores2 ? ` (${b.bebesMenores2} menores de 2)` : ''} · ${b.mayores65} mayores de 65`,
      paso: 'personas',
    },
    { titulo: 'Situaciones especiales', valor: especiales, paso: 'especiales' },
    { titulo: 'Animales', valor: `${b.mascotas} mascotas${b.tieneAnimales ? ` · ${b.ganadoTexto || 'ganado u otros animales'}` : ''}`, paso: 'mascotas' },
    { titulo: 'Contacto de emergencia', valor: [b.contactoNombre, b.contactoTelefono].filter((x) => x.trim()).join(' · ') || 'Sin contacto', paso: 'contacto' },
    { titulo: 'Punto de encuentro', valor: b.puntoEncuentro.trim() || 'El sugerido para tu sector', paso: 'encuentro' },
  ]
  return (
    <Pregunta titulo="Tu hogar" ayuda="Revisa que todo esté bien. Puedes cambiar cualquier dato." tituloRef={tituloRef}>
      <dl className={s.resumen}>
        {filas.map((f) => (
          <div key={f.titulo} className={s.resumenFila}>
            <dt>{f.titulo}</dt>
            <dd>{f.valor}</dd>
            <button type="button" className={`hds-btn hds-btn--tertiary hds-btn--sm ${s.cambiar}`} onClick={() => onCambiar(f.paso)}>
              <Icon name="pencil" size={16} />
              Cambiar<span className={s.srOnly}> {f.titulo.toLowerCase()}</span>
            </button>
          </div>
        ))}
      </dl>
    </Pregunta>
  )
}
