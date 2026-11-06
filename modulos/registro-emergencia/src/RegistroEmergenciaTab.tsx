import { Alert } from '@muni/design-system'
import { useMemo, type ReactNode } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { PanelAccesibilidad } from './componentes/PanelAccesibilidad'
import { propsRaiz } from './lib/accesibilidad'
import { useEmergencia } from './lib/contexto'
import { ProveedorEmergencia } from './lib/Proveedor'
import { ruta } from './lib/rutas'
import { Beneficios } from './pantallas/Beneficios'
import { Cuestionario } from './pantallas/Cuestionario'
import { Landing } from './pantallas/Landing'
import { Recompensa } from './pantallas/Recompensa'
import { crearApiHttp, type EmergenciaApi } from './servicios/api'
import s from './styles/ui.module.css'

export interface RegistroEmergenciaTabProps {
  /** Backend del registro. Por defecto, HTTP contra `/api/emergencia` del mismo sitio. */
  api?: EmergenciaApi
}

/**
 * Pestaña "Registro de emergencia". Usa rutas anidadas bajo `/emergencia/*`
 * (el sitio monta la pestaña con `path/*`); no trae router propio.
 */
export function RegistroEmergenciaTab({ api }: RegistroEmergenciaTabProps) {
  const backend = useMemo(() => api ?? crearApiHttp(), [api])
  return (
    <ProveedorEmergencia api={backend}>
      <Raiz>
        <Routes>
          <Route index element={<Landing />} />
          <Route path="inscripcion" element={<Cuestionario />} />
          <Route path="listo" element={<Recompensa />} />
          <Route path="beneficios" element={<Beneficios />} />
          <Route path="recuperar" element={<EnConstruccion titulo="Recuperar mi código" />} />
          <Route path="*" element={<EnConstruccion titulo="No encontramos esta página" />} />
        </Routes>
      </Raiz>
    </ProveedorEmergencia>
  )
}

/**
 * Contenedor de la pestaña con las opciones de accesibilidad aplicadas. El cuestionario
 * trae su propio botón (junto a "Pregunta X de Y") para que cada pregunta siga entrando
 * en la pantalla del celular.
 */
function Raiz({ children }: { children: ReactNode }) {
  const { accesibilidad, cambiarAccesibilidad } = useEmergencia()
  const enCuestionario = /\/inscripcion\/?$/.test(useLocation().pathname)
  const raiz = propsRaiz(accesibilidad)
  return (
    <div {...raiz} className={`${s.root} ${raiz.className}`}>
      {!enCuestionario && (
        <div className={s.barraAccesibilidad}>
          <PanelAccesibilidad preferencias={accesibilidad} onCambiar={cambiarAccesibilidad} />
        </div>
      )}
      {children}
    </div>
  )
}

/** Pantallas de los hitos siguientes (ej. R6). */
function EnConstruccion({ titulo }: { titulo: string }) {
  return (
    <div className={s.intro}>
      <h1>{titulo}</h1>
      <Alert tone="info" title="Estamos preparando esta sección">
        Mientras tanto, puedes <Link to={ruta('inscripcion')}>inscribir a tu familia</Link> o <Link to={ruta()}>volver al inicio del registro</Link>.
      </Alert>
    </div>
  )
}
