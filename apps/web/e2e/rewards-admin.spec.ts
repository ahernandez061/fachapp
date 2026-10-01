import { expect, test } from '@playwright/test'
import { ADMIN, LUCIA, login, testPng } from './helpers'

test('premios: canjear y usar un tema, un marco y un título', async ({ page }) => {
  await login(page, LUCIA)
  await page.goto('#/premios')
  await expect(page.getByRole('heading', { name: 'Premios' })).toBeVisible()
  const balance = page.getByRole('region', { name: 'Tu saldo' })
  const before = Number((await balance.locator('p').first().innerText()).replace(/\D/g, ''))
  expect(before).toBeGreaterThanOrEqual(80 + 100 + 120)

  // Tema rojigualda: se canjea, se equipa y cambia el color primario de la app
  const theme = page.getByRole('listitem', { name: 'Rojigualda', exact: true })
  await theme.getByRole('button', { name: 'Canjear Rojigualda por 100 puntos' }).click()
  await expect(theme.getByRole('button', { name: /Puesto/ })).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--primary')))
    .not.toBe('')

  // Título y marco
  const title = page.getByRole('listitem', { name: 'Patriota', exact: true })
  await title.getByRole('button', { name: /Canjear Patriota/ }).click()
  await expect(title.getByRole('button', { name: /Puesto/ })).toBeVisible()
  const frame = page.getByRole('listitem', { name: 'Marco rojigualda', exact: true })
  await frame.getByRole('button', { name: /Canjear Marco rojigualda/ }).click()
  await expect(frame.getByRole('button', { name: /Puesto/ })).toBeVisible()

  // El saldo baja, pero los puntos del ranking no
  await expect(balance.locator('p').first()).toHaveText(String(before - 300))
  await page.goto('#/u/lucia_sev')
  await expect(page.getByText('🏅 Patriota')).toBeVisible()
  await expect(page.locator('[data-frame="marco_rojigualda"]')).toBeVisible()

  // Quitar el tema devuelve el color de serie
  await page.goto('#/premios')
  await page
    .getByRole('listitem', { name: 'Rojigualda', exact: true })
    .getByRole('button', { name: /Puesto/ })
    .click()
  await expect
    .poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--primary')))
    .toBe('')
})

test('premios: sin puntos suficientes el canje está bloqueado', async ({ page }) => {
  await login(page, 'dani@fachapp.local')
  await page.goto('#/premios')
  await expect(
    page
      .getByRole('listitem', { name: 'Oro', exact: true })
      .getByRole('button', { name: 'Canjear Oro por 600 puntos' }),
  ).toBeDisabled()
})

test('admin: crear un reto nuevo con foto de portada desde Misiones', async ({ page }) => {
  const title = `Reto de prueba ${Date.now().toString(36)}`
  await login(page, ADMIN)
  await page.getByRole('link', { name: 'Misiones' }).click()
  await page.getByRole('button', { name: 'Nuevo reto' }).click()
  const dialog = page.getByRole('dialog', { name: 'Nueva misión' })
  await dialog.getByLabel('Título').fill(title)
  await dialog
    .getByLabel('Descripción')
    .fill('Foto en la Puerta del Sol con el reloj de las campanadas.')
  await dialog.getByLabel('Categoría').fill('españa')
  await dialog
    .getByTestId('gallery-input')
    .setInputFiles({ name: 'portada.png', mimeType: 'image/png', buffer: testPng() })
  await page.getByRole('button', { name: 'Usar foto' }).click()
  await expect(dialog.getByAltText('Vista previa de la foto')).toBeVisible()
  await dialog.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText('Misión creada')).toBeVisible()

  // Aparece en el listado con su portada subida al bucket "covers"
  const card = page.getByRole('link', { name: new RegExp(title) })
  await expect(card).toBeVisible()
  await expect(card.locator('img[src*="/covers/"]')).toBeVisible()
})

test('un usuario normal no ve el botón de crear retos', async ({ page }) => {
  await login(page, 'usuario@fachapp.local')
  await page.getByRole('link', { name: 'Misiones' }).click()
  await expect(page.getByRole('heading', { name: 'Misiones' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Nuevo reto' })).toHaveCount(0)
})
