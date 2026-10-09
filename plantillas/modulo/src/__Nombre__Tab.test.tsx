import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { __Nombre__Tab } from './__Nombre__Tab'

describe('<__Nombre__Tab />', () => {
  it('muestra el título de la sección', () => {
    render(<__Nombre__Tab />)
    expect(screen.getByRole('heading', { level: 1, name: '__LABEL__' })).toBeInTheDocument()
  })
})
