import { Cauce, Icon, Logo } from '@muni/design-system'
import { useEffect, useState } from 'react'
import { fechaTabla } from '../../shared/fechas.ts'
import { NIVELES, type Nivel } from '../../shared/incentivos.ts'
import { useQr } from '../lib/qr'
import s from '../styles/tarjeta.module.css'

export interface DatosTarjeta {
  nombre: string | null
  direccion: string | null
  integrantes: number | null
  codigo?: string
  nivel?: Nivel
  vigenteHasta?: string
  pausada?: boolean
}

interface Props {
  datos: DatosTarjeta
  /** Vista previa del cuestionario: miniatura que se va llenando, sin QR. */
  previa?: boolean
  /** Entrega animada (R3): aparece y se voltea mostrando el QR. */
  entrega?: boolean
  menosMovimiento?: boolean
  /** Sobre fondo azul (héroe de R1): inclinada y con borde claro para separarse del fondo. */
  destacada?: boolean
}

/**
 * Tarjeta Hogar Preparado. El QR contiene solo el código familiar.
 * El escudo va siempre en su versión original sobre placa blanca (nunca recoloreado).
 */
export function TarjetaHogar({ datos, previa = false, entrega = false, menosMovimiento = false, destacada = false }: Props) {
  const [volteada, setVolteada] = useState(false)
  const qr = useQr(previa ? undefined : datos.codigo)

  // Entrega: muestra el frente y luego se voltea sola (≤ 1,2 s en total).
  useEffect(() => {
    if (!entrega || menosMovimiento || !datos.codigo) return
    const t = setTimeout(() => setVolteada(true), 700)
    return () => clearTimeout(t)
  }, [entrega, menosMovimiento, datos.codigo])

  const clases = [s.tarjeta, previa && s.previa, menosMovimiento && s.quieta, volteada && s.volteada].filter(Boolean).join(' ')

  return (
    <div className={`${s.envoltorio} ${entrega && !menosMovimiento ? s.entrega : ''} ${destacada ? s.destacada : ''}`}>
      <div className={clases} data-testid="tarjeta-hogar">
        <div className={s.cara} aria-hidden={volteada}>
          <div className={s.cabecera}>
            <span className={s.placa}>
              <Logo variant="escudo" height={previa ? 28 : 40} />
            </span>
            <span className={s.marca}>
              <span className={s.marcaTitulo}>Hogar Preparado</span>
              <span className={s.marcaSub}>Hualañé</span>
            </span>
          </div>

          <p className={s.nombre}>{datos.nombre ?? <span className={s.vacio}>Tu familia</span>}</p>
          <ul className={s.datos}>
            <li>
              <Icon name="map-pin" size={16} />
              {datos.direccion ?? <span className={s.vacio}>Tu dirección</span>}
            </li>
            <li>
              <Icon name="users" size={16} />
              {datos.integrantes ? `${datos.integrantes} ${datos.integrantes === 1 ? 'persona' : 'personas'}` : <span className={s.vacio}>Integrantes</span>}
            </li>
          </ul>

          <div className={s.pie}>
            <span className={s.codigo}>{datos.codigo ?? <span className={s.vacio}>Tu código</span>}</span>
            {datos.nivel && (
              <span className={s.nivel}>
                Nivel {datos.nivel} · {NIVELES[datos.nivel].nombre}
              </span>
            )}
          </div>
          {datos.vigenteHasta && (
            <p className={s.vigencia}>
              {datos.pausada ? 'Beneficios en pausa · confirma tus datos' : `Vigente hasta ${fechaTabla(datos.vigenteHasta)}`}
            </p>
          )}
          <div className={s.cauce} aria-hidden="true">
            <Cauce thickness={5} gap={46} colors={['var(--blue-500)', 'rgba(255,255,255,.85)', 'var(--green-500)']} />
          </div>
        </div>

        {!previa && (
          <div className={`${s.cara} ${s.reverso}`} aria-hidden={!volteada}>
            <div className={s.qr} role="img" aria-label={`Código QR de tu tarjeta. Código ${datos.codigo ?? ''}`}>
              {qr ? <span dangerouslySetInnerHTML={{ __html: qr }} /> : <Icon name="qr-code" size={64} />}
            </div>
            <p className={s.codigoGrande}>{datos.codigo}</p>
            <p className={s.ayudaQr}>Muestra este código para usar beneficios o retirar ayuda.</p>
          </div>
        )}
      </div>

      {!previa && datos.codigo && (
        <button type="button" className={`hds-btn hds-btn--tertiary hds-btn--sm ${s.voltear}`} onClick={() => setVolteada((v) => !v)}>
          <Icon name={volteada ? 'credit-card' : 'qr-code'} size={18} />
          {volteada ? 'Ver el frente de la tarjeta' : 'Ver el código QR'}
        </button>
      )}
    </div>
  )
}
