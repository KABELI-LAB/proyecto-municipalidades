import { useId, useState, type FormEvent } from 'react'
import type { ArchivoCv, DisenoId } from '../export'
import type { CvMailer } from '../services/mailer'
import { AnalisisError } from '../services/types'
import s from '../styles/ui.module.css'

interface Props {
  mailer: CvMailer
  diseno: DisenoId
  nombreDiseno: string
  nombrePersona: string
  emailSugerido?: string
  generar: () => Promise<ArchivoCv[]>
}

type Estado =
  | { tipo: 'editando' }
  | { tipo: 'enviando' }
  | { tipo: 'enviado'; email: string }
  /** campo: el error es del correo ingresado (se marca el input como inválido). */
  | { tipo: 'error'; mensaje: string; campo: boolean }

const MENSAJE_EMAIL_SERVIDOR = 'Revise el correo ingresado.'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Paso final: la persona deja su correo y recibe el diseño elegido en PDF y Word. */
export function EnvioCorreo({ mailer, diseno, nombreDiseno, nombrePersona, emailSugerido, generar }: Props) {
  const [email, setEmail] = useState(emailSugerido ?? '')
  const [sitioWeb, setSitioWeb] = useState('')
  const [estado, setEstado] = useState<Estado>({ tipo: 'editando' })
  const ids = { email: useId(), ayuda: useId(), error: useId() }

  const enviando = estado.tipo === 'enviando'
  const errorCampo = estado.tipo === 'error' && estado.campo

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (enviando) return
    const destino = email.trim()
    if (!EMAIL_RE.test(destino)) {
      setEstado({ tipo: 'error', mensaje: 'Ingrese un correo válido, por ejemplo nombre@correo.cl.', campo: true })
      return
    }
    setEstado({ tipo: 'enviando' })
    try {
      const adjuntos = await generar()
      await mailer.enviar({ email: destino, nombre: nombrePersona, diseno, adjuntos, sitioWeb })
      setEstado({ tipo: 'enviado', email: destino })
    } catch (err) {
      const mensaje = err instanceof AnalisisError ? err.message : 'No pudimos enviar el correo. Inténtelo nuevamente.'
      setEstado({ tipo: 'error', mensaje, campo: mensaje === MENSAJE_EMAIL_SERVIDOR })
    }
  }

  return (
    <form className={s.envio} onSubmit={enviar} noValidate aria-labelledby={`${ids.email}-titulo`}>
      <h4 id={`${ids.email}-titulo`}>Reciba su CV por correo</h4>
      <p>
        Le enviaremos el diseño <strong>{nombreDiseno}</strong> en PDF y en Word, para que pueda editarlo.
      </p>

      <div className={s.campo}>
        <label htmlFor={ids.email}>Correo electrónico</label>
        <div className={s.campoFila}>
          <input
            id={ids.email}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (!enviando) setEstado({ tipo: 'editando' })
            }}
            aria-invalid={errorCampo || undefined}
            aria-describedby={`${ids.ayuda}${errorCampo ? ` ${ids.error}` : ''}`}
            readOnly={enviando}
            required
          />
          {/* aria-disabled (no disabled) para que el foco no se pierda durante el envío. */}
          <button type="submit" className={s.btnPrimary} aria-disabled={enviando || undefined}>
            {enviando ? 'Enviando…' : 'Enviar a mi correo'}
          </button>
        </div>
        <p id={ids.ayuda} className={s.nota}>
          Usaremos su correo solo para enviarle este CV. No lo guardamos.
        </p>
      </div>

      {/* Honeypot: invisible para personas; si un bot lo completa, no se envía nada. */}
      <div className={s.honeypot} aria-hidden="true">
        <label>
          Sitio web
          <input type="text" tabIndex={-1} autoComplete="off" value={sitioWeb} onChange={(e) => setSitioWeb(e.target.value)} />
        </label>
      </div>

      <div aria-live="polite">
        {enviando && <p className={s.nota}>Preparando y enviando su CV…</p>}
        {estado.tipo === 'enviado' && (
          <p className={s.exito}>
            {mailer.demo ? (
              <>Modo demostración: el correo no se envió. Con el servicio configurado, llegaría a {estado.email}.</>
            ) : (
              <>
                Listo. Enviamos su CV a <strong>{estado.email}</strong>. Si no lo ve en unos minutos, revise la carpeta de correo no deseado.
              </>
            )}
          </p>
        )}
      </div>
      {estado.tipo === 'error' && (
        <p id={ids.error} className={s.alert} role="alert">
          {estado.mensaje}
        </p>
      )}
    </form>
  )
}
