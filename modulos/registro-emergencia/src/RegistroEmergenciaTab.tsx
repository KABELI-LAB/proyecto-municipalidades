import { Alert } from '@muni/design-system'
import { useMemo } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
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
      <div className={s.root}>
        <Routes>
          <Route index element={<Landing />} />
          <Route path="inscripcion" element={<Cuestionario />} />
          <Route path="listo" element={<Recompensa />} />
          <Route path="beneficios" element={<Beneficios />} />
          <Route path="recuperar" element={<EnConstruccion titulo="Recuperar mi código" />} />
          <Route path="*" element={<EnConstruccion titulo="No encontramos esta página" />} />
        </Routes>
      </div>
    </ProveedorEmergencia>
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
