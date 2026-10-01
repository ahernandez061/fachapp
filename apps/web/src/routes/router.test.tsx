import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from './router'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
}

describe('navegación', () => {
  it('muestra el feed en la ruta inicial', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { name: 'Feed' })).toBeInTheDocument()
  })

  it('la barra inferior navega entre secciones', async () => {
    renderAt('/')
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(nav).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: 'Ranking' }))
    expect(screen.getByRole('heading', { name: 'Ranking' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: 'Misiones' }))
    expect(screen.getByRole('heading', { name: 'Misiones' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Misiones' })).toHaveAttribute('aria-current', 'page')
  })

  it('muestra un 404 amable en rutas desconocidas', () => {
    renderAt('/no-existe')
    expect(screen.getByText('Aquí no hay nada')).toBeInTheDocument()
  })
})
