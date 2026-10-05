import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import { MODULOS } from './modulos'

const renderEn = (ruta: string) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <App />
    </MemoryRouter>,
  )

describe('<App />', () => {
  it('muestra Inicio y cada módulo registrado en el navbar', () => {
    renderEn('/')
    const nav = screen.getByRole('navigation', { name: 'Secciones del sitio' })
    expect(within(nav).getByRole('link', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page')
    for (const { meta } of MODULOS) {
      expect(within(nav).getByRole('link', { name: meta.label })).toHaveAttribute('href', meta.path)
    }
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(MODULOS.length)
  })

  it('navega a un módulo desde el navbar', async () => {
    const user = userEvent.setup()
    renderEn('/')
    const nav = screen.getByRole('navigation', { name: 'Secciones del sitio' })
    await user.click(within(nav).getByRole('link', { name: 'Revisa tu CV' }))
    expect(screen.getByRole('heading', { name: 'Revise y mejore su currículum' })).toBeInTheDocument()
  })

  it('las rutas de los módulos son únicas', () => {
    const paths = MODULOS.map((m) => m.meta.path)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('muestra una página 404 para rutas desconocidas', () => {
    renderEn('/no-existe')
    expect(screen.getByRole('heading', { name: 'No encontramos esta página' })).toBeInTheDocument()
  })
})
