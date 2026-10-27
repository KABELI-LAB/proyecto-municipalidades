import { Alert, Button, Icon } from '@muni/design-system'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { InscripcionCreada, MiHogar } from '../../shared/contrato.ts'
import { fechaLegible } from '../../shared/fechas.ts'
import { PlanFamiliarVista } from '../componentes/PlanFamiliarVista'
import { PorDefinir } from '../componentes/PorDefinir'
import { TarjetaHogar } from '../componentes/TarjetaHogar'
import { CLAVES, leer } from '../lib/almacen'
import { useEmergencia } from '../lib/contexto'
import { descargar, planPdf, tarjetaPng } from '../lib/descargas'
import { ruta } from '../lib/rutas'
import s from '../styles/paginas.module.css'

/** R3 · Momento de recompensa: se siente como recibir algo. */
export function Recompensa() {
  const { menosMovimiento } = useEmergencia()
  const [resultado] = useState(() => leer<InscripcionCreada>(CLAVES.resultado))
  const tituloRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    tituloRef.current?.focus()
  }, [])

  if (!resultado) {
    return (
      <div className={s.pagina}>
        <h1 className={s.h1} ref={tituloRef} tabIndex={-1}>
          No encontramos tu tarjeta en este dispositivo
        </h1>
        <p>Si ya te inscribiste, te la enviamos a tu WhatsApp. También puedes pedirla de nuevo.</p>
        <div className={s.botones}>
          <Link to={ruta('recuperar')} className="hds-btn hds-btn--primary hds-btn--lg">
            Recuperar mi tarjeta
          </Link>
          <Link to={ruta('inscripcion')} className="hds-btn hds-btn--secondary hds-btn--lg">
            Inscribir a mi familia
          </Link>
        </div>
      </div>
    )
  }

  const h = resultado.hogar
  return (
    <div className={s.pagina}>
      <section className={s.entrega} aria-labelledby="re-listo">
        <p className={s.celebracionGrande}>
          <span className={s.checkGrande}>
            <Icon name="check" size={28} />
          </span>
          Tarjeta activada
        </p>
        <h1 id="re-listo" ref={tituloRef} tabIndex={-1} className={s.h1}>
          Tu hogar ya está preparado
        </h1>
        <TarjetaHogar
          entrega
          menosMovimiento={menosMovimiento}
          datos={{
            nombre: h.nombreTarjeta,
            direccion: h.direccion,
            integrantes: h.totalPersonas,
            codigo: h.codigoFamiliar,
            vigenteHasta: h.vigenteHasta,
          }}
        />
        <p className={s.textoTarjeta}>
          Muestra tu tarjeta en el celular o impresa para usar beneficios y retirar ayuda en una emergencia. Si la pierdes, basta con el RUT del jefe o jefa de hogar.
        </p>
        <Acciones hogar={h} />
        <p className={s.notaWhatsapp}>
          <Icon name="message-circle" size={20} />
          También te la enviamos a tu WhatsApp. Vigente hasta el {fechaLegible(h.vigenteHasta, true)}.
        </p>
      </section>

      <section className={s.seccion} aria-labelledby="re-beneficios">
        <div className={s.seccionCabecera}>
          <p className={s.rotulo}>Beneficios</p>
          <h2 id="re-beneficios" className={s.h2}>
            Lo que ganas con tu tarjeta
          </h2>
        </div>
        <PorDefinir titulo="Beneficios por definir" texto="Te avisaremos por WhatsApp cuando estén disponibles." />
      </section>

      <section className={s.seccion} aria-labelledby="re-plan">
        <div className={s.seccionCabecera}>
          <p className={s.rotulo}>Plan familiar de emergencia</p>
          <h2 id="re-plan" className={s.h2}>
            Hecho para tu hogar
          </h2>
        </div>
        <PlanFamiliarVista plan={h.plan} />
      </section>
    </div>
  )
}

function Acciones({ hogar }: { hogar: MiHogar }) {
  const [ocupado, setOcupado] = useState<'png' | 'pdf' | null>(null)
  const [aviso, setAviso] = useState<{ tono: 'success' | 'error'; texto: string } | null>(null)

  const hacer = async (tipo: 'png' | 'pdf') => {
    setOcupado(tipo)
    setAviso(null)
    try {
      if (tipo === 'png') descargar(await tarjetaPng(hogar), `tarjeta-hogar-preparado-${hogar.codigoFamiliar}.png`)
      else descargar(await planPdf(hogar), `plan-familiar-${hogar.codigoFamiliar}.pdf`)
    } catch {
      setAviso({ tono: 'error', texto: 'No pudimos generar el archivo. Inténtalo de nuevo.' })
    } finally {
      setOcupado(null)
    }
  }

  // El link para compartir no lleva datos personales: invita a inscribirse.
  const compartir = async () => {
    const url = new URL(ruta(), window.location.origin).toString()
    const texto = 'Inscribe a tu familia en el Registro de Emergencia de Hualañé y recibe tu Tarjeta Hogar Preparado.'
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Registro de Emergencia de Hualañé', text: texto, url })
        return
      }
      await navigator.clipboard.writeText(`${texto} ${url}`)
      setAviso({ tono: 'success', texto: 'Copiamos el link. Pégalo en el chat de tu familia.' })
    } catch {
      // Compartir cancelado por la persona: no es un error.
    }
  }

  return (
    <div className={s.accionesTarjeta}>
      <Button variant="primary" size="lg" iconLeft="smartphone" loading={ocupado === 'png'} onClick={() => void hacer('png')} block>
        Guardar en el celular
      </Button>
      <Button variant="secondary" size="lg" iconLeft="download" loading={ocupado === 'pdf'} onClick={() => void hacer('pdf')} block>
        Descargar PDF
      </Button>
      <Button variant="secondary" size="lg" iconLeft="share-2" onClick={() => void compartir()} block>
        Compartir con mi familia
      </Button>
      {aviso && (
        <div aria-live="polite">
          <Alert tone={aviso.tono}>{aviso.texto}</Alert>
        </div>
      )}
    </div>
  )
}
