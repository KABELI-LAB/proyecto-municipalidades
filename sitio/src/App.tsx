import { MunicipioProvider, useMunicipio, type MunicipioId } from '@muni/design-system'
import { useEffect, useRef } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { FranjaMunicipio } from './componentes/FranjaMunicipio'
import { useMunicipioElegido } from './municipio'
import { MODULOS } from './modulos'
import { NoEncontrada } from './paginas/NoEncontrada'
import { TEMAS } from './temas'

export function App() {
  const [municipio, elegir] = useMunicipioElegido()
  return (
    <MunicipioProvider municipio={municipio}>
      <Sitio municipio={municipio} onElegir={elegir} />
    </MunicipioProvider>
  )
}

function Sitio({ municipio, onElegir }: { municipio: MunicipioId; onElegir: (m: MunicipioId) => void }) {
  const { Header, Inicio, Pie, estilos: s } = TEMAS[municipio]
  const nombreSitio = `Municipalidad de ${useMunicipio().nombre}`
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const primeraCarga = useRef(true)

  // Título del documento: cambia con la pestaña y con el municipio.
  useEffect(() => {
    const modulo = MODULOS.find((m) => pathname === m.meta.path || pathname.startsWith(`${m.meta.path}/`))
    document.title = modulo ? `${modulo.meta.label} · ${nombreSitio}` : nombreSitio
  }, [pathname, nombreSitio])

  // Al cambiar de pestaña: scroll arriba y foco en el contenido para que
  // lectores de pantalla anuncien la nueva página.
  useEffect(() => {
    if (primeraCarga.current) {
      primeraCarga.current = false
      return
    }
    window.scrollTo(0, 0)
    mainRef.current?.focus()
  }, [pathname])

  return (
    <div className={s.layout}>
      <a href="#contenido" className={s.skip}>
        Saltar al contenido
      </a>
      <FranjaMunicipio municipio={municipio} onElegir={onElegir} />
      <Header />
      <main id="contenido" ref={mainRef} tabIndex={-1} className={s.main}>
        <Routes>
          <Route path="/" element={<Inicio />} />
          {MODULOS.map(({ meta, Component }) => (
            // `/*`: un módulo puede tener rutas internas (rutas anidadas, ver docs/arquitectura.md).
            <Route key={meta.id} path={`${meta.path}/*`} element={<Component />} />
          ))}
          <Route path="*" element={<NoEncontrada />} />
        </Routes>
      </main>
      <Pie />
    </div>
  )
}

