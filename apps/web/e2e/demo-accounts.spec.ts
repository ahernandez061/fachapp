import { expect, test } from '@playwright/test'

// Requiere VITE_DEMO_ACCOUNTS=true (lo pone `npm run sb:setup` en apps/web/.env.local).
test('botón "Entrar como usuario": cuenta normal sin panel de admin', async ({ page }) => {
  await page.goto('#/entrar')
  await page.getByRole('button', { name: 'Entrar como usuario' }).click()
  await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Administración' })).toHaveCount(0)
  await page.goto('#/admin')
  await expect(page).not.toHaveURL(/#\/admin/)
  await page.goto('#/perfil')
  await expect(page.getByRole('heading', { name: 'Usuario Demo' })).toBeVisible()
})

test('botón "Entrar como admin": panel con usuarios y permisos', async ({ page }) => {
  await page.goto('#/bienvenida')
  await page.getByRole('button', { name: 'Entrar como admin' }).click()
  await page.getByRole('link', { name: 'Administración' }).click()
  await page.getByRole('tab', { name: /Usuarios/ }).click()
  const users = page.getByRole('list', { name: 'Usuarios' })
  await expect(users.getByText('Usuario Demo')).toBeVisible()

  // Dar y quitar permisos de admin a la cuenta normal
  await users.getByRole('button', { name: 'Hacer admin a usuario_demo' }).click()
  await page.getByRole('button', { name: 'Hacer admin', exact: true }).click()
  await expect(page.getByText('@usuario_demo ahora es administrador')).toBeVisible()
  await users.getByRole('button', { name: 'Quitar admin a usuario_demo' }).click()
  await page.getByRole('button', { name: 'Quitar admin', exact: true }).click()
  await expect(page.getByText('@usuario_demo ya no es administrador')).toBeVisible()
})
