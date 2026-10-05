import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CvTab } from './CvTab'
import { analizarTexto } from './services/mockAnalyzer'
import type { CvAnalyzer } from './services/types'
import { CV_COMPLETO } from './test/fixtures'

vi.mock('./lib/extractText', () => ({
  extractText: vi.fn(async () => CV_COMPLETO),
}))

const instantAnalyzer: CvAnalyzer = { analyze: async (input) => analizarTexto(input) }

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

  it('muestra un error con formatos no compatibles', async () => {
    const user = userEvent.setup({ applyAccept: false })
    render(<CvTab analyzer={instantAnalyzer} />)
    await user.upload(screen.getByTestId('cv-file-input'), new File(['x'], 'foto.png', { type: 'image/png' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Formato no compatible')
  })
})
