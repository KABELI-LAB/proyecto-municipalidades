import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { handleEmergenciaRequest } from '../server/handler.ts'
import { ConsoleProvider } from '../server/mensajeria.ts'
import { crearRepoMemoria, type RepoMemoria } from '../server/repoMemoria.ts'
import { RegistroEmergenciaTab } from './RegistroEmergenciaTab'
import { crearApiHttp } from './servicios/api'

// API real (cliente HTTP + handler + repositorio en memoria), sin red.
let repo: RepoMemoria
function apiDePrueba() {
  repo = crearRepoMemoria()
  const ctx = { repo, mensajeria: new ConsoleProvider(), ahora: () => new Date(), urlBase: 'http://localhost/emergencia' }
  return crearApiHttp('/api/emergencia', async (url, init) =>
    handleEmergenciaRequest(new Request(new URL(String(url), 'http://localhost'), init), {}, ctx),
  )
}

function montar(ruta: string, api = apiDePrueba()) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/emergencia/*" element={<RegistroEmergenciaTab api={api} />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => sessionStorage.clear())

const siguiente = (user: ReturnType<typeof userEvent.setup>, nombre: string | RegExp = 'Siguiente') =>
  user.click(screen.getByRole('button', { name: nombre }))

describe('R1 · Landing', () => {
  it('pone la tarjeta como héroe, deja los beneficios por definir y lleva al cuestionario', async () => {
    montar('/emergencia')
    expect(screen.getByRole('heading', { level: 1, name: /Inscribe a tu familia y recibe tu Tarjeta Hogar Preparado/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Quiero mi Tarjeta Hogar Preparado/ })).toHaveAttribute('href', '/emergencia/inscripcion')
    expect(screen.getByText('Beneficios por definir')).toBeInTheDocument()
    expect(screen.queryByText(/descuento/i)).not.toBeInTheDocument()
    // Con 20 hogares (< 50) no se muestra el contador.
    expect(screen.queryByText(/hogares de Hualañé ya están preparados/)).not.toBeInTheDocument()
  })
})

describe('R2 · Cuestionario', () => {
  it('se completa de principio a fin y entrega la tarjeta (R3)', async () => {
    const user = userEvent.setup()
    montar('/emergencia/inscripcion')

    await user.type(await screen.findByLabelText('Nombre y apellidos'), 'Rosa Ficticia Prueba')
    await siguiente(user)

    expect(screen.getByRole('heading', { name: '¿Cuál es el RUT de Rosa?' })).toHaveFocus()
    await user.type(screen.getByLabelText(/RUT del jefe/), '123456785')
    expect(screen.getByLabelText(/RUT del jefe/)).toHaveValue('12.345.678-5')
    expect(screen.getByText('RUT válido')).toBeInTheDocument()
    await siguiente(user)

    await user.type(screen.getByLabelText('Celular con WhatsApp'), '900009999')
    await siguiente(user)

    // Opción única: avanza sola al elegir.
    await user.click(screen.getByRole('radio', { name: 'La Huerta' }))
    // Ya no se pregunta por la junta de vecinos.
    await user.type(await screen.findByLabelText('Dirección'), 'Pasaje Uno 12')
    await siguiente(user)
    expect(screen.getByRole('status')).toHaveTextContent('Listo, tu hogar ya tiene ubicación.')

    await user.click(screen.getByRole('radio', { name: 'Propia' }))
    await screen.findByRole('heading', { name: '¿Cuántas personas viven en la casa?' })
    await user.click(screen.getByRole('button', { name: 'Agregar uno: Personas' }))
    await user.click(screen.getByRole('button', { name: 'Agregar uno: Personas' }))
    await siguiente(user)

    await user.click(screen.getByRole('button', { name: 'Agregar uno: Menores de 18' }))
    await siguiente(user)
    // Hay un menor: pregunta por guaguas.
    await user.click(screen.getByRole('button', { name: 'Agregar uno: Menores de 2 años' }))
    await siguiente(user)
    await siguiente(user) // mayores: 0
    await siguiente(user, 'Saltar esta pregunta') // situaciones especiales
    await user.click(screen.getByRole('button', { name: 'Agregar uno: Mascotas' }))
    await siguiente(user)
    await user.click(screen.getByRole('radio', { name: 'No' }))
    await user.click(await screen.findByRole('button', { name: 'Saltar por ahora' })) // contacto
    await siguiente(user, 'Usar el punto sugerido')

    const resumen = await screen.findByRole('heading', { name: 'Tu hogar', level: 1 })
    expect(resumen).toBeInTheDocument()
    expect(screen.getByText('3 en total · 1 menores de 18 (1 menores de 2) · 0 mayores de 65')).toBeInTheDocument()
    await siguiente(user, 'Todo está bien')

    // Sin consentimiento no se activa.
    await user.click(screen.getByRole('button', { name: 'Activar mi tarjeta' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Sin tu autorización no podemos crear tu tarjeta')
    expect(repo.estado.hogares).toHaveLength(20)
    await user.click(screen.getByRole('checkbox', { name: 'Acepto que guarden los datos de mi hogar (obligatorio)' }))
    await user.click(screen.getByRole('button', { name: 'Activar mi tarjeta' }))

    // R3: tarjeta con código, plan familiar con pañales y alimento para la mascota.
    expect(await screen.findByRole('heading', { name: 'Tu hogar ya está preparado' })).toBeInTheDocument()
    const tarjeta = screen.getByTestId('tarjeta-hogar')
    expect(within(tarjeta).getAllByText(/^FAM-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{2}$/).length).toBeGreaterThan(0)
    expect(within(tarjeta).getByText('Familia Ficticia')).toBeInTheDocument()
    expect(screen.getByText('Pañales para 3 días')).toBeInTheDocument()
    expect(screen.getByText('Agua y alimento para 3 días')).toBeInTheDocument()
    expect(screen.getByText('Cancha de La Huerta')).toBeInTheDocument()
    expect(screen.getByText('Beneficios por definir')).toBeInTheDocument()
    expect(screen.queryByText(/Nivel 1/)).not.toBeInTheDocument()

    // Se creó un solo hogar y el borrador ya no está.
    expect(repo.estado.hogares).toHaveLength(21)
    expect(sessionStorage.getItem('emergencia:borrador')).toBeNull()
  })

  it('valida el RUT antes de avanzar', async () => {
    const user = userEvent.setup()
    montar('/emergencia/inscripcion')
    await user.type(await screen.findByLabelText('Nombre y apellidos'), 'Rosa Ficticia')
    await siguiente(user)
    await user.type(screen.getByLabelText(/RUT del jefe/), '12345678K')
    await siguiente(user)
    expect(screen.getByText(/el dígito verificador no coincide/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /¿Cuál es el RUT/ })).toBeInTheDocument()
  })

  it('volver atrás no borra respuestas', async () => {
    const user = userEvent.setup()
    montar('/emergencia/inscripcion')
    await user.type(await screen.findByLabelText('Nombre y apellidos'), 'Rosa Ficticia')
    await siguiente(user)
    await user.click(screen.getByRole('button', { name: 'Atrás' }))
    expect(screen.getByLabelText('Nombre y apellidos')).toHaveValue('Rosa Ficticia')
  })

  it('recargar la página no pierde el avance', async () => {
    const user = userEvent.setup()
    const { unmount } = montar('/emergencia/inscripcion')
    await user.type(await screen.findByLabelText('Nombre y apellidos'), 'Rosa Ficticia')
    await siguiente(user)
    unmount()

    montar('/emergencia/inscripcion')
    await user.click(screen.getByRole('button', { name: 'Seguir donde quedé' }))
    expect(await screen.findByRole('heading', { name: '¿Cuál es el RUT de Rosa?' })).toBeInTheDocument()
  })

  it('anuncia en qué pregunta vas y cuánto falta', async () => {
    montar('/emergencia/inscripcion')
    expect(await screen.findByText(/^Pregunta 1 de \d+$/)).toBeInTheDocument()
    expect(screen.getByText(/^Quedan unos/)).toBeInTheDocument()
  })

  it('modo asistido marca el origen y quita animaciones', async () => {
    montar('/emergencia/inscripcion?modo=asistido')
    expect(await screen.findByText('Modo asistido')).toBeInTheDocument()
  })
})

describe('B1 · Beneficios', () => {
  it('muestra el espacio por definir', () => {
    montar('/emergencia/beneficios')
    expect(screen.getByRole('heading', { level: 1, name: 'Beneficios' })).toBeInTheDocument()
    expect(screen.getByText('Beneficios por definir')).toBeInTheDocument()
  })
})

describe('R3 sin datos', () => {
  it('ofrece recuperar la tarjeta si no hay inscripción en el dispositivo', () => {
    montar('/emergencia/listo')
    expect(screen.getByRole('heading', { name: 'No encontramos tu tarjeta en este dispositivo' })).toBeInTheDocument()
  })
})
