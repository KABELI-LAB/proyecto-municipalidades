import { useEffect, useRef } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Header } from './componentes/Header'
import { MODULOS } from './modulos'
import { Inicio } from './paginas/Inicio'
import { NoEncontrada } from './paginas/NoEncontrada'
import s from './sitio.module.css'

const NOMBRE_SITIO = 'Municipalidad de Hualañé'

export function App() {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const primeraCarga = useRef(true)

  // Al cambiar de pestaña: título del documento, scroll arriba y foco en el
  // contenido para que lectores de pantalla anuncien la nueva página.
  useEffect(() => {
    const modulo = MODULOS.find((m) => m.meta.path === pathname)
    document.title = modulo ? `${modulo.meta.label} · ${NOMBRE_SITIO}` : NOMBRE_SITIO
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
      <Header nombreSitio={NOMBRE_SITIO} />
      <main id="contenido" ref={mainRef} tabIndex={-1} className={s.main}>
        <Routes>
          <Route path="/" element={<Inicio />} />
          {MODULOS.map(({ meta, Component }) => (
            <Route key={meta.id} path={meta.path} element={<Component />} />
          ))}
          <Route path="*" element={<NoEncontrada />} />
        </Routes>
      </main>
      <footer className={s.footer}>
        <p>{NOMBRE_SITIO} · Sitio en desarrollo</p>
      </footer>
    </div>
  )
}
