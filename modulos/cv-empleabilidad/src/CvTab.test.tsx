import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CvTab } from './CvTab'
import { evaluarDocumento } from './services/mockAnalyzer'
import type { CvMailer } from './services/mailer'
import type { CvAnalyzer } from './services/types'
import { CV_COMPLETO, RECETA } from './test/fixtures'

const extractMock = vi.hoisted(() => vi.fn())
vi.mock('./lib/extractText', () => ({ extractText: extractMock }))
beforeEach(() => extractMock.mockResolvedValue({ texto: CV_COMPLETO, imagenes: 0 }))

// La generación real de PDF/Word se prueba aparte; aquí basta con archivos falsos.
vi.mock('./export', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./export')>()),
  generarArchivos: vi.fn(async () => [
    { nombre: 'cv.pdf', tipo: 'pdf', blob: new Blob(['%PDF']) },
    { nombre: 'cv.docx', tipo: 'docx', blob: new Blob(['PK']) },
  ]),
}))

const instantAnalyzer: CvAnalyzer = { analyze: async (input) => evaluarDocumento(input) }

describe('<CvTab />', () => {
  it('sube un CV y muestra feedback y los 3 diseños', async () => {
    const user = userEvent.setup()
    render(<CvTab analyzer={instantAnalyzer} />)

    const file = new File(['%PDF'], 'mi-cv.pdf', { type: 'application/pdf' })
    await user.upload(screen.getByTestId('cv-file-input'), file)

    expect(await screen.findByText('Resultado del análisis')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Clásico/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getAllByRole('tab')).toHaveLength(3)

    await user.click(screen.getByRole('tab', { name: /Moderno/ }))
    expect(screen.getByRole('tab', { name: /Moderno/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getAllByText('María José Fuentes Rojas').length).toBeGreaterThan(0)
  })

  it('envía el diseño elegido al correo indicado', async () => {
    const user = userEvent.setup()
    const enviar = vi.fn<CvMailer['enviar']>(async () => {})
    render(<CvTab analyzer={instantAnalyzer} mailer={{ enviar }} />)
    await user.upload(screen.getByTestId('cv-file-input'), new File(['%PDF'], 'mi-cv.pdf', { type: 'application/pdf' }))
    await screen.findByText('Resultado del análisis')

    await user.click(screen.getByRole('tab', { name: /Compacto/ }))
    const campo = screen.getByLabelText('Correo electrónico')
    expect(campo).toHaveValue('maria.fuentes@example.com') // sugerido desde el CV

    await user.clear(campo)
    await user.type(campo, 'no-es-correo')
    await user.click(screen.getByRole('button', { name: 'Enviar a mi correo' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ingrese un correo válido')
    expect(enviar).not.toHaveBeenCalled()

    await user.clear(campo)
    await user.type(campo, 'persona@example.com')
    await user.click(screen.getByRole('button', { name: 'Enviar a mi correo' }))
    expect(await screen.findByText(/Enviamos su CV a/)).toHaveTextContent('persona@example.com')
    expect(enviar).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'persona@example.com', diseno: 'compacto', adjuntos: expect.arrayContaining([expect.objectContaining({ tipo: 'pdf' })]) }),
    )
  })

  it('avisa cuando el archivo no es un CV y no muestra diseños', async () => {
    extractMock.mockResolvedValue({ texto: RECETA, imagenes: 2 })
    const user = userEvent.setup()
    render(<CvTab analyzer={instantAnalyzer} />)
    await user.upload(screen.getByTestId('cv-file-input'), new File(['%PDF'], 'receta.pdf', { type: 'application/pdf' }))
    expect(await screen.findByText(/no parece ser un currículum/)).toBeInTheDocument()
    expect(screen.queryByText('Resultado del análisis')).not.toBeInTheDocument()
    expect(screen.queryAllByRole('tab')).toHaveLength(0)
    // Puede subir otro archivo de inmediato.
    expect(screen.getByTestId('cv-file-input')).toBeInTheDocument()
  })

  it('muestra un error con formatos no compatibles', async () => {
    const user = userEvent.setup({ applyAccept: false })
    render(<CvTab analyzer={instantAnalyzer} />)
    await user.upload(screen.getByTestId('cv-file-input'), new File(['x'], 'foto.png', { type: 'image/png' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Formato no compatible')
  })
})
