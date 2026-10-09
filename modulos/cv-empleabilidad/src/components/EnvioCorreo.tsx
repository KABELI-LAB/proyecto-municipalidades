import { Alert, Icon } from '@muni/design-system'
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

const MENSAJE_EMAIL_SERVIDOR = 'Revisa el correo que escribiste.'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Paso final: la persona deja su correo y recibe el diseño elegido en PDF y Word. */
export function EnvioCorreo({ mailer, diseno, nombreDiseno, nombrePersona, emailSugerido, generar }: Props) {
  const [email, setEmail] = useState(emailSugerido ?? '')
  const [sitioWeb, setSitioWeb] = useState('')
  const [estado, setEstado] = useState<Estado>({ tipo: 'editando' })
  const ids = { titulo: useId(), email: useId(), ayuda: useId(), error: useId() }

  const enviando = estado.tipo === 'enviando'
  const errorCampo = estado.tipo === 'error' && estado.campo

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (enviando) return
    const destino = email.trim()
    if (!EMAIL_RE.test(destino)) {
      setEstado({ tipo: 'error', mensaje: 'Escribe un correo válido, por ejemplo nombre@correo.cl.', campo: true })
      return
    }
    setEstado({ tipo: 'enviando' })
    try {
      const adjuntos = await generar()
      await mailer.enviar({ email: destino, nombre: nombrePersona, diseno, adjuntos, sitioWeb })
      setEstado({ tipo: 'enviado', email: destino })
    } catch (err) {
      const mensaje = err instanceof AnalisisError ? err.message : 'No pudimos enviar el correo. Inténtalo de nuevo.'
      setEstado({ tipo: 'error', mensaje, campo: mensaje === MENSAJE_EMAIL_SERVIDOR })
    }
  }

  return (
    <form className={s.envio} onSubmit={enviar} noValidate aria-labelledby={ids.titulo}>
      <div>
        <h3 id={ids.titulo}>Recibe tu CV por correo</h3>
        <p className={s.textoSecundario}>
          Te enviamos el diseño <strong>{nombreDiseno}</strong> en PDF y en Word, para que puedas editarlo.
        </p>
      </div>

      <div className="hds-field">
        <label htmlFor={ids.email} className="hds-label">
          Correo electrónico
        </label>
        <div className={s.campoFila}>
          <input
            id={ids.email}
            className="hds-input"
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
          <button type="submit" className="hds-btn hds-btn--primary" aria-disabled={enviando || undefined} aria-busy={enviando || undefined}>
            {enviando ? <span className="hds-spinner" aria-hidden="true" /> : <Icon name="send" size={20} />}
            <span>{enviando ? 'Enviando…' : 'Enviar a mi correo'}</span>
          </button>
        </div>
        {errorCampo ? (
          <span id={ids.error} className="hds-error-msg" role="alert">
            <Icon name="circle-alert" size={18} />
            {estado.mensaje}
          </span>
        ) : null}
        <span id={ids.ayuda} className="hds-hint">
          Usamos tu correo solo para enviarte este CV. No lo guardamos.
        </span>
      </div>

      {/* Honeypot: invisible para personas; si un bot lo completa, no se envía nada. */}
      <div className="hds-visually-hidden" aria-hidden="true">
        <label>
          Sitio web
          <input type="text" tabIndex={-1} autoComplete="off" value={sitioWeb} onChange={(e) => setSitioWeb(e.target.value)} />
        </label>
      </div>

      <div aria-live="polite">
        {enviando && <p className={s.nota}>Preparando y enviando tu CV…</p>}
        {estado.tipo === 'enviado' &&
          (mailer.demo ? (
            <Alert tone="info" title="Modo demostración">
              El correo no se envió. Con el servicio configurado, llegaría a {estado.email}.
            </Alert>
          ) : (
            <Alert tone="success" title="Listo, te enviamos tu CV">
              Lo enviamos a <strong>{estado.email}</strong>. Si no lo ves en unos minutos, revisa la carpeta de correo no deseado.
            </Alert>
          ))}
      </div>
      {estado.tipo === 'error' && !estado.campo && (
        <Alert tone="error" title="No pudimos enviar el correo">
          {estado.mensaje}
        </Alert>
      )}
    </form>
  )
}
