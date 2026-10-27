import { Alert, Button, Icon, Loader } from '@muni/design-system'
import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import type { Territorio } from '../../shared/contrato.ts'
import type { Tenencia } from '../../shared/esquemas.ts'
import { formatearRut } from '../../shared/rut.ts'
import { formatearCelular, normalizarCelular } from '../../shared/telefono.ts'
import { CONSENTIMIENTO } from '../../shared/textos.ts'
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
/** Preguntas con más contenido: en pantallas muy bajas ocultan la franja "Tu hogar" para entrar sin scroll. */
const PASOS_LARGOS: IdPaso[] = ['direccion', 'especiales', 'resumen', 'activar']

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
  /** Editando desde el resumen: al terminar este paso se vuelve al resumen. */
  const [volverTras, setVolverTras] = useState<IdPaso | null>(null)
  const [envio, setEnvio] = useState<Envio>({ estado: 'inactivo' })
  const [direccionAnim, setDireccionAnim] = useState<'adelante' | 'atras'>('adelante')
  const tituloRef = useRef<HTMLHeadingElement>(null)
  const raizRef = useRef<HTMLDivElement>(null)
  const primerRender = useRef(true)
  const sesion = useMemo(() => {
    const previa = leer<string>(CLAVES.sesion)
    if (previa) return previa
    const nueva = globalThis.crypto.randomUUID()
    guardar(CLAVES.sesion, nueva)
    return nueva
  }, [])

  const pedirTerritorio = useCallback(() => {
    api.territorio().then(
      (t) => {
        setTerritorio(t)
        setErrorCarga(false)
      },
      () => setErrorCarga(true),
    )
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

  // El mensaje "Listo, …" se muestra unos segundos en el encabezado y desaparece.
  useEffect(() => {
    if (!celebracion) return
    const t = setTimeout(() => setCelebracion(null), 3500)
    return () => clearTimeout(t)
  }, [celebracion])

  // Celular: el cuestionario ocupa exactamente el alto libre bajo el encabezado del sitio,
  // así cada pregunta, sus botones y la franja "Tu hogar" entran sin hacer scroll.
  useLayoutEffect(() => {
    const el = raizRef.current
    if (!el) return
    const medir = () => {
      const arriba = el.getBoundingClientRect().top + window.scrollY
      el.style.setProperty('--alto-libre', `calc(100dvh - ${Math.round(arriba) + 12}px)`)
    }
    medir()
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [pendiente])

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
    if (volverTras === p.id) {
      setVolverTras(null)
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
    if (volverTras) {
      setVolverTras(null)
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

  /** Edita un grupo del resumen: recorre sus pasos y vuelve al resumen al terminar el último. */
  const cambiarDesdeResumen = (desde: IdPaso, hasta: IdPaso) => {
    const ultimo = visibles.some((x) => x.id === hasta) ? hasta : desde
    setVolverTras(ultimo)
    irA(desde, 'atras')
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
          setVolverTras(destino)
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

  const nombreCorto = b.jefeNombre.trim() ? `Familia de ${b.jefeNombre.trim().split(/\s+/)[0]}` : null
  const integrantes = alcanzado('personas') ? b.totalPersonas : null
  const casa = (
    <CasaEnVivo
      adultos={Math.max(0, adultos)}
      menores={b.menores18}
      bebes={b.bebesMenores2}
      mayores={b.mayores65}
      mascotas={b.mascotas}
      animales={b.tieneAnimales === true}
      conUbicacion={respondido('direccion') || b.lat !== null}
    />
  )

  return (
    <div ref={raizRef} data-pantalla="cuestionario" data-largo={PASOS_LARGOS.includes(paso.id) || undefined} className={`${s.raiz} ${asistido ? s.asistido : ''} ${menosMovimiento ? s.quieto : ''}`}>
      <Encabezado bloqueActual={bloqueActual} celebracion={celebracion} pregunta={indice + 1} total={visibles.length} restantes={restantes} />

      <div className={s.layout}>
        <form className={s.formulario} onSubmit={onSubmit} noValidate>
          {!territorio && !errorCarga && <Loader label="Cargando…" />}
          {errorCarga && !territorio && (
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
                <span className={s.textoAtras}>Atrás</span>
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
                  {volverTras === paso.id ? 'Volver al resumen' : textoSiguiente(paso.id, b)}
                </Button>
              ))}
          </div>
        </form>

        <aside className={s.panel} aria-label="Tu hogar">
          {/* Escritorio: casa grande y tarjeta. */}
          <div className={s.panelCompleto}>
            <p className={s.panelTitulo}>Tu hogar</p>
            <div className={s.panelContenido}>
              {casa}
              <div className={s.panelTarjeta}>
                <TarjetaHogar previa datos={{ nombre: nombreCorto, direccion: b.direccion.trim() || null, integrantes }} />
              </div>
            </div>
          </div>
          {/* Celular: franja compacta para que la pregunta entre completa en la pantalla. */}
          <div className={s.panelFranja}>
            <div className={s.franjaCasa}>{casa}</div>
            <div className={s.miniTarjeta}>
              <span className={s.miniMarca}>Hogar Preparado</span>
              <span className={s.miniNombre}>{nombreCorto ?? 'Tu familia'}</span>
              <span className={s.miniDatos}>
                {[integrantes && `${integrantes} ${integrantes === 1 ? 'persona' : 'personas'}`, b.direccion.trim()].filter(Boolean).join(' · ') ||
                  'Se completa con tus respuestas'}
              </span>
            </div>
          </div>
        </aside>

        <div className={s.pieFormulario}>
          <InterruptorMovimiento />
          {asistido && <span className={s.etiquetaAsistido}>Modo asistido</span>}
        </div>
      </div>
    </div>
  )
}

function textoSiguiente(paso: IdPaso, b: Borrador): string {
  if (paso === 'especiales' && !b.especiales.ninguna && !b.especiales.noResponde && !b.especiales.discapacidad && !b.especiales.embarazada && !b.especiales.electrodependiente)
    return 'Saltar'
  if (paso === 'contacto' && !b.contactoNombre.trim() && !b.contactoTelefono.trim()) return 'Saltar por ahora'
  if (paso === 'encuentro' && !b.puntoEncuentro.trim()) return 'Usar el punto sugerido'
  if (paso === 'resumen') return 'Todo está bien'
  return 'Siguiente'
}

function tiempoRestante(pasos: number): { corto: string; largo: string } {
  const seg = pasos * SEGUNDOS_POR_PASO
  if (seg <= 0) return { corto: 'Último paso', largo: 'Último paso' }
  if (seg < 60) {
    const n = Math.max(10, Math.round(seg / 10) * 10)
    return { corto: `Faltan ${n} s`, largo: `Quedan unos ${n} segundos` }
  }
  const min = Math.round(seg / 60)
  return min <= 1 ? { corto: 'Falta 1 min', largo: 'Queda cerca de un minuto' } : { corto: `Faltan ${min} min`, largo: `Quedan unos ${min} minutos` }
}

// ── Encabezado: barra de desbloqueo + avance + "Menos movimiento" ────────────

function Encabezado({ bloqueActual, celebracion, pregunta, total, restantes }: {
  bloqueActual: number
  celebracion: string | null
  pregunta: number
  total: number
  restantes: number
}) {
  const faltan = BLOQUES.length - 1 - bloqueActual
  const tiempo = tiempoRestante(restantes)
  return (
    <div className={s.desbloqueo}>
      {/* El mensaje "Listo, …" ocupa el lugar del título unos segundos: no empuja la pregunta. */}
      {celebracion ? (
        <p className={s.celebracion} role="status">
          <span className={s.celebracionCheck}>
            <Icon name="check" size={16} />
          </span>
          {celebracion}
        </p>
      ) : (
        <p className={s.desbloqueoTitulo}>
          <Icon name={faltan === 0 ? 'credit-card' : 'lock'} size={18} />
          {faltan === 0 ? 'Último paso para activar tu tarjeta' : `${faltan + 1} pasos para activar tu tarjeta`}
        </p>
      )}
      <ol className={s.hitos}>
        {BLOQUES.map((bl, i) => {
          const estado = i < bloqueActual ? 'listo' : i === bloqueActual ? 'actual' : 'pendiente'
          return (
            <li key={bl.id} className={s.hito} data-estado={estado}>
              <span className={s.hitoBarra} />
              <span className={s.hitoTexto}>
                {estado === 'listo' && <Icon name="check" size={14} />}
                {bl.hito}
                {estado !== 'pendiente' && <span className={s.srOnly}>{`, ${estado === 'listo' ? 'listo' : 'en curso'}`}</span>}
              </span>
            </li>
          )
        })}
      </ol>
      <div className={s.meta}>
        <span aria-live="polite" className={s.metaTexto}>
          <span className={s.metaLargo}>
            Pregunta {pregunta} de {total}
            <span className={s.tiempoLargo}>{tiempo.largo}</span>
          </span>
          {/* Celular: versión corta en una línea (los lectores de pantalla leen la larga). */}
          <span className={s.metaCorto} aria-hidden="true">
            {pregunta} de {total} · {tiempo.corto}
          </span>
        </span>
        <span className={s.movimientoMovil}>
          <InterruptorMovimiento />
        </span>
      </div>
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
  onCambiar: (desde: IdPaso, hasta: IdPaso) => void
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
        <Pregunta titulo="¿De quién es la casa?" tituloRef={tituloRef}>
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
              { valor: 'allegados', etiqueta: 'Allegados', descripcion: 'En casa de otra familia', icono: 'users' },
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
        <Pregunta titulo="Activa tu tarjeta" tituloRef={tituloRef}>
          <p className={s.ayudaPregunta}>Sin tu autorización no podemos crear la tarjeta.</p>
          <details className={s.consentimiento}>
            <summary>Leer la autorización completa</summary>
            {CONSENTIMIENTO.texto.split('\n').map((linea) => (
              <p key={linea}>{linea}</p>
            ))}
          </details>
          <OpcionMultiple etiqueta="Acepto que guarden los datos de mi hogar (obligatorio)" marcada={b.consentimiento} onChange={(v) => actualizar({ consentimiento: v })} icono="shield-check" />
          <OpcionMultiple etiqueta="Recordatorios por WhatsApp" descripcion="Cada 6 meses, para confirmar tus datos."  marcada={b.recordatorios} onChange={(v) => actualizar({ recordatorios: v })} icono="message-circle" />
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
            Quitar
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
          <p className={s.ayuda}>{b.lat !== null ? 'Arrastra el pin si no quedó justo en tu casa.' : 'Toca tu casa en el mapa. Es opcional.'}</p>
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
      ayuda="Es opcional. Nos ayuda a llegar primero a quien no puede moverse solo."
      tituloRef={tituloRef}
    >
      <div className={s.listaCompacta}>
        <OpcionMultiple etiqueta="Discapacidad o postración" icono="accessibility" marcada={e.discapacidad > 0} onChange={(v) => set({ discapacidad: v ? 1 : 0 })}>
          <div className={s.subcontador}>
            <Contador etiqueta="¿Cuántas personas?" valor={e.discapacidad} min={1} max={b.totalPersonas} onChange={(v) => set({ discapacidad: v })} />
          </div>
        </OpcionMultiple>
        <OpcionMultiple etiqueta="Embarazada" icono="baby" marcada={e.embarazada} onChange={(v) => set({ embarazada: v })} />
        <OpcionMultiple etiqueta="Electrodependiente" descripcion="Equipo médico eléctrico" icono="heart-pulse" marcada={e.electrodependiente} onChange={(v) => set({ electrodependiente: v })} />
      </div>
      <div className={s.chips} role="group" aria-label="Otras respuestas">
        <button type="button" className="hds-chip" aria-pressed={e.ninguna} onClick={() => set({ ninguna: !e.ninguna })}>
          Ninguna
        </button>
        <button type="button" className="hds-chip" aria-pressed={e.noResponde} onClick={() => set({ noResponde: !e.noResponde })}>
          Prefiero no responder
        </button>
      </div>
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
  const personas = [
    `${b.totalPersonas} ${b.totalPersonas === 1 ? 'persona' : 'personas'}`,
    b.menores18 > 0 && `${b.menores18} ${b.menores18 === 1 ? 'menor' : 'menores'} de 18`,
    b.bebesMenores2 > 0 && `${b.bebesMenores2} ${b.bebesMenores2 === 1 ? 'guagua' : 'guaguas'}`,
    b.mayores65 > 0 && `${b.mayores65} ${b.mayores65 === 1 ? 'mayor' : 'mayores'} de 65`,
  ]
  const animales = [b.mascotas > 0 && `${b.mascotas} ${b.mascotas === 1 ? 'mascota' : 'mascotas'}`, b.tieneAnimales && (b.ganadoTexto.trim() || 'ganado u otros animales')]
  const bloques: { titulo: string; lineas: (string | false | null | undefined)[]; desde: IdPaso; hasta: IdPaso }[] = [
    {
      titulo: 'Jefe o jefa de hogar',
      lineas: [b.jefeNombre, `${b.sinRut ? 'Sin RUT' : formatearRut(b.rut)} · ${formatearCelular(normalizarCelular(b.whatsapp) ?? b.whatsapp)}`],
      desde: 'nombre',
      hasta: 'whatsapp',
    },
    {
      titulo: 'Dónde viven',
      lineas: [`${b.direccion}${b.lat !== null ? ' (en el mapa)' : ''}`, `${sector ?? ''} · Casa ${tenencia.toLowerCase()}`],
      desde: 'sector',
      hasta: 'tenencia',
    },
    {
      titulo: 'Quiénes viven',
      lineas: [personas.filter(Boolean).join(' · '), [especiales !== 'Ninguna' && especiales, ...animales].filter(Boolean).join(' · ')],
      desde: 'personas',
      hasta: 'animales',
    },
    {
      titulo: 'En una emergencia',
      lineas: [
        [b.contactoNombre, b.contactoTelefono].filter((x) => x.trim()).join(' · ') || 'Sin contacto de emergencia',
        `Punto de encuentro: ${b.puntoEncuentro.trim() || 'el sugerido'}`,
      ],
      desde: 'contacto',
      hasta: 'encuentro',
    },
  ]
  return (
    <Pregunta titulo="Revisa tu hogar" tituloRef={tituloRef}>
      <dl className={s.resumen}>
        {bloques.map((f) => (
          <div key={f.titulo} className={s.resumenFila}>
            <dt>{f.titulo}</dt>
            {f.lineas.filter(Boolean).map((l) => (
              <dd key={String(l)}>{l}</dd>
            ))}
            <button
              type="button"
              className={`hds-btn hds-btn--tertiary hds-btn--sm ${s.cambiar}`}
              onClick={() => onCambiar(f.desde, f.hasta)}
              aria-label={`Cambiar ${f.titulo.toLowerCase()}`}
            >
              <Icon name="pencil" size={18} />
              <span className={s.textoCambiar}>Cambiar</span>
            </button>
          </div>
        ))}
      </dl>
    </Pregunta>
  )
}
