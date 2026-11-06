import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { CvTab } from '../CvTab'
import { leerPreferencias } from '../lib/accesibilidad'
import { useZoom } from '../lib/zoom'
import { ControlZoom } from './Zoom'

beforeEach(() => sessionStorage.clear())

describe('Opciones de accesibilidad', () => {
  it('abre el panel, aplica las opciones a la pestaña y las recuerda en la sesión', async () => {
    const user = userEvent.setup()
    const { container } = render(<CvTab />)
    const raiz = container.firstElementChild!
    const boton = screen.getByRole('button', { name: 'Accesibilidad' })
    expect(boton).toHaveAttribute('aria-expanded', 'false')

    await user.click(boton)
    expect(boton).toHaveAttribute('aria-expanded', 'true')
    await user.click(screen.getByRole('switch', { name: 'Alto contraste' }))
    await user.click(screen.getByRole('radio', { name: /Muy grande/ }))

    expect(raiz).toHaveAttribute('data-theme', 'high-contrast')
    expect(raiz.className).toMatch(/textoMuyGrande/)
    expect(screen.getByRole('button', { name: /Accesibilidad 2 opciones activas/ })).toBeInTheDocument()
    expect(leerPreferencias()).toMatchObject({ contraste: true, texto: 'muyGrande' })

    await user.click(screen.getByRole('button', { name: 'Restablecer opciones' }))
    expect(raiz).not.toHaveAttribute('data-theme')
    expect(screen.getByText('Restablecimos las opciones de accesibilidad.')).toBeInTheDocument()
  })

  it('Esc cierra el panel y devuelve el foco al botón', async () => {
    const user = userEvent.setup()
    render(<CvTab />)
    const boton = screen.getByRole('button', { name: 'Accesibilidad' })
    await user.click(boton)
    await user.click(screen.getByRole('switch', { name: 'Subrayar enlaces' }))
    await user.keyboard('{Escape}')
    expect(boton).toHaveAttribute('aria-expanded', 'false')
    expect(boton).toHaveFocus()
  })

  it('ignora valores guardados inválidos', () => {
    sessionStorage.setItem('muni:accesibilidad', JSON.stringify({ texto: 'enorme', contraste: 'si' }))
    expect(leerPreferencias()).toMatchObject({ texto: 'normal', contraste: false })
    sessionStorage.setItem('muni:accesibilidad', '{roto')
    expect(leerPreferencias().texto).toBe('normal')
  })
})

function ZoomDePrueba() {
  return <ControlZoom zoom={useZoom()} />
}

describe('Zoom del CV', () => {
  it('acerca y aleja por pasos, con límites y opción de volver a ajustar', async () => {
    const user = userEvent.setup()
    render(<ZoomDePrueba />)
    expect(screen.getByRole('status')).toHaveTextContent('100 %')
    expect(screen.getByRole('button', { name: 'Alejar' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Ajustar al ancho' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Acercar' }))
    await user.click(screen.getByRole('button', { name: 'Acercar' }))
    expect(screen.getByRole('status')).toHaveTextContent('150 %')

    await user.click(screen.getByRole('button', { name: 'Ajustar al ancho' }))
    expect(screen.getByRole('status')).toHaveTextContent('100 %')

    for (let i = 0; i < 8; i++) await user.click(screen.getByRole('button', { name: 'Acercar' }))
    expect(screen.getByRole('status')).toHaveTextContent('300 %')
    expect(screen.getByRole('button', { name: 'Acercar' })).toBeDisabled()
  })
})
