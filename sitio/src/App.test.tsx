import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { MODULOS } from './modulos'

const renderEn = (ruta: string) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <App />
    </MemoryRouter>,
  )

describe('<App />', () => {
  beforeEach(() => {
    window.localStorage.clear()
    delete document.documentElement.dataset.tema
  })

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
    expect(screen.getByRole('heading', { name: 'Mejora tu CV' })).toBeInTheDocument()
  })

  it('las rutas de los módulos son únicas', () => {
    const paths = MODULOS.map((m) => m.meta.path)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('muestra una página 404 para rutas desconocidas', () => {
    renderEn('/no-existe')
    expect(screen.getByRole('heading', { name: 'No encontramos esta página' })).toBeInTheDocument()
  })

  describe('selector de municipio', () => {
    it('parte en Hualañé y cambia el diseño, el logo y el nombre del sitio', async () => {
      const user = userEvent.setup()
      renderEn('/')
      const selector = screen.getByRole('group', { name: 'Municipio de la demostración' })
      expect(within(selector).getByRole('button', { name: 'Hualañé' })).toHaveAttribute('aria-pressed', 'true')
      expect(document.documentElement.dataset.tema).toBe('hualane')

      await user.click(within(selector).getByRole('button', { name: 'Vichuquén' }))
      expect(within(selector).getByRole('button', { name: 'Vichuquén' })).toHaveAttribute('aria-pressed', 'true')
      expect(document.documentElement.dataset.tema).toBe('vichuquen')
      expect(document.title).toBe('Municipalidad de Vichuquén')
      expect(screen.getAllByAltText('Ilustre Municipalidad de Vichuquén, Avanzando juntos').length).toBeGreaterThan(0)
      expect(screen.getByText('Estás viendo el sitio de Vichuquén.')).toBeInTheDocument()
      // Los módulos siguen en el navbar.
      const nav = screen.getByRole('navigation', { name: 'Secciones del sitio' })
      for (const { meta } of MODULOS) expect(within(nav).getByRole('link', { name: meta.label })).toBeInTheDocument()
    })

    it('recuerda el municipio elegido', async () => {
      const user = userEvent.setup()
      const { unmount } = renderEn('/')
      await user.click(screen.getByRole('button', { name: 'Curepto' }))
      unmount()
      renderEn('/')
      expect(screen.getByRole('button', { name: 'Curepto' })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getAllByAltText('Municipalidad de Curepto').length).toBeGreaterThan(0)
    })
  })
})
