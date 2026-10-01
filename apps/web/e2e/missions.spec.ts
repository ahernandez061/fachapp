import { expect, test } from '@playwright/test'
import { ADMIN, login, newUser, testPng } from './helpers'

test('misión con foto: el usuario sube la prueba y un admin la aprueba', async ({ browser }) => {
  // Usuario
  const userCtx = await browser.newContext()
  const page = await userCtx.newPage()
  const username = await newUser(page)

  await page.getByRole('link', { name: /Atardecer en España/ }).click()
  await page.getByRole('link', { name: 'Subir foto' }).click()
  await page
    .getByTestId('gallery-input')
    .setInputFiles({ name: 'atardecer.png', mimeType: 'image/png', buffer: testPng() })
  await page.getByRole('button', { name: 'Usar foto' }).click()
  await expect(page.getByAltText('Vista previa de la foto')).toBeVisible()
  await page.getByLabel('Texto').fill('Atardecer de prueba E2E')
  await page.getByRole('button', { name: 'Enviar prueba' }).click()
  await expect(page.getByRole('heading', { name: '¡Prueba enviada!' })).toBeVisible()

  // Admin
  const adminCtx = await browser.newContext()
  const admin = await adminCtx.newPage()
  await login(admin, ADMIN)
  await admin.goto('#/admin')
  const card = admin.getByRole('listitem').filter({ hasText: `@${username}` })
  await expect(card).toBeVisible()
  await expect(card.getByRole('img', { name: `Prueba de ${username}` })).toBeVisible()
  await card.getByRole('button', { name: 'Aprobar' }).click()
  await expect(admin.getByText('Prueba aprobada')).toBeVisible()

  // El usuario ve la misión completada, el post en su perfil y la notificación
  await page.goto('#/misiones/10000000-0000-4000-a000-000000000004')
  await expect(page.getByText('¡Ya completaste esta misión!')).toBeVisible()
  await page.goto('#/notificaciones')
  await expect(
    page.getByRole('main').getByText(/Misión completada! “Atardecer en España”/),
  ).toBeVisible()
  await expect(page.getByRole('main').getByText('Nueva insignia: Primer paso 🏅')).toBeVisible()
  await page.goto(`#/u/${username}`)
  await expect(page.getByText('80').first()).toBeVisible()

  await userCtx.close()
  await adminCtx.close()
})

test('filtros de misiones', async ({ page }) => {
  await newUser(page)
  await page.getByLabel('Verificación').selectOption('x_auto')
  await expect(page.getByRole('link', { name: /Estrena el #FachApp/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Tapeo con amigos/ })).toHaveCount(0)
  await page.getByLabel('Buscar misiones').fill('nada que coincida')
  await expect(page.getByText('No hay misiones con esos filtros')).toBeVisible()
  await page.getByRole('button', { name: 'Quitar filtros' }).click()
  await expect(page.getByRole('link', { name: /Tapeo con amigos/ })).toBeVisible()
})

test('misión de X: consentimiento, conexión (mock) y verificación', async ({ page }) => {
  await newUser(page)
  await page.getByRole('link', { name: /Estrena el #FachApp/ }).click()
  await page.getByRole('link', { name: 'conectar tu cuenta de X' }).click()

  const connect = page.getByRole('button', { name: 'Conectar con X' })
  await expect(connect).toBeDisabled()
  await page.getByRole('checkbox').check()
  await connect.click()

  await expect(page.getByRole('heading', { name: 'Estrena el #FachApp' })).toBeVisible()
  await page.getByRole('button', { name: 'Verificar con X' }).click()
  await expect(page.getByText(/Misión completada! \+50 puntos/)).toBeVisible()
  await expect(page.getByText('¡Ya completaste esta misión!')).toBeVisible()
})
