import { expect, test } from '@playwright/test'
import { LUCIA, login, newUser, testPng } from './helpers'

test('publicación con varias fotos y hashtag, visible en Explorar', async ({ page }) => {
  await newUser(page)
  const tag = `prueba${Date.now().toString(36)}`

  await page.getByRole('link', { name: 'Subir' }).click()
  await page.getByLabel('¿Qué quieres subir?').selectOption({ label: 'Publicación libre' })
  const selected = page.getByRole('list', { name: 'Fotos seleccionadas' }).getByRole('listitem')
  for (const [i, name] of ['uno.png', 'dos.png'].entries()) {
    await page
      .getByTestId('gallery-input')
      .setInputFiles({ name, mimeType: 'image/png', buffer: testPng() })
    await page.getByRole('button', { name: 'Usar foto' }).click()
    await expect(selected).toHaveCount(i + 1)
  }
  await expect(
    page.getByRole('list', { name: 'Fotos seleccionadas' }).getByRole('listitem'),
  ).toHaveCount(2)
  await page.getByLabel('Texto').fill(`Mis dos fotos de prueba #${tag}`)
  await page.getByRole('button', { name: 'Publicar' }).click()
  await expect(page.getByText('Publicado')).toBeVisible()

  // El hashtag es un enlace que lleva a su página
  await page.goto('#/?tab=discover')
  const post = page.getByRole('article').filter({ hasText: `#${tag}` })
  await expect(post.getByRole('button', { name: 'Foto 1 de 2' })).toBeVisible()
  await post.getByRole('link', { name: `#${tag}` }).click()
  await expect(page.getByRole('heading', { name: `#${tag}` })).toBeVisible()
  await expect(
    page.getByRole('list', { name: `Fotos con #${tag}` }).getByRole('listitem'),
  ).toHaveCount(1)
})

test('doble toque en la foto da me gusta', async ({ page }) => {
  await newUser(page)
  await page.goto('#/?tab=discover')
  // Primera publicación con foto a la que aún no he dado me gusta (índice fijo: el filtro
  // cambiaría de tarjeta en cuanto le dé me gusta).
  const articles = page.getByRole('article')
  await expect(articles.first()).toBeVisible()
  const idx = await articles.evaluateAll((els) =>
    els.findIndex(
      (el) =>
        el.querySelector('[aria-roledescription="carrusel"]') &&
        el.querySelector('button[aria-label="Me gusta"]'),
    ),
  )
  expect(idx).toBeGreaterThanOrEqual(0)
  const post = articles.nth(idx)
  await post.getByRole('button', { name: /^Ver foto$|^Foto 1 de/ }).dblclick()
  await expect(post.getByRole('button', { name: 'Quitar me gusta' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('galería del perfil con visor a pantalla completa', async ({ page }) => {
  await login(page, LUCIA)
  await page.goto('#/u/lucia_sev')
  const gallery = page.getByRole('list', { name: 'Galería de Lucía Romero' })
  await gallery.getByRole('button').first().click()
  const viewer = page.getByRole('dialog')
  await expect(viewer).toBeVisible()
  await expect(viewer.getByRole('button', { name: 'Foto siguiente' })).toBeVisible()
  await viewer.getByRole('button', { name: 'Foto siguiente' }).click()
  await expect(viewer.getByText(/^2\/\d+$/)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(viewer).toBeHidden()
})

test('Explorar: reto de la semana, hashtags y tendencias', async ({ page }) => {
  await login(page, LUCIA)
  await expect(
    page.getByRole('link', { name: /Reto de la semana: Foto con la bandera de España/ }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Explorar' }).click()
  await expect(page.getByRole('heading', { name: 'Hashtags del momento' })).toBeVisible()
  await page.getByRole('link', { name: /#concebolla/ }).click()
  await expect(page.getByRole('heading', { name: '#concebolla' })).toBeVisible()
  await page.goto('#/explorar')
  await expect(
    page.getByRole('list', { name: 'Fotos en tendencia' }).getByRole('listitem').first(),
  ).toBeVisible()
})
