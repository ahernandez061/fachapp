import { expect, test } from '@playwright/test'
import { login, newUser, testPng } from './helpers'

// Usuarios del seed que actúan como "gente random" que vota.
const VOTERS = ['lucia', 'pablo', 'marta', 'javi', 'sara'].map((u) => `${u}@fachapp.local`)

test('validación por la comunidad: 5 votos a favor dan el reto por superado', async ({
  browser,
}) => {
  test.setTimeout(240_000)
  const note = `Jamón de prueba ${Date.now()}`

  // 1) Un usuario nuevo sube su prueba
  const authorCtx = await browser.newContext()
  const author = await authorCtx.newPage()
  await newUser(author)
  await author.getByRole('link', { name: /Jamón, jamón/ }).click()
  await author.getByRole('link', { name: 'Subir foto' }).click()
  await author
    .getByTestId('gallery-input')
    .setInputFiles({ name: 'jamon.png', mimeType: 'image/png', buffer: testPng() })
  await author.getByRole('button', { name: 'Usar foto' }).click()
  await author.getByLabel('Texto').fill(note)
  await author.getByRole('button', { name: 'Enviar prueba' }).click()
  await expect(author.getByText(/la votará la comunidad/)).toBeVisible()

  // Su propia prueba no le aparece para votar
  await author.goto('#/validar')
  await expect(author.getByText(note)).toHaveCount(0)

  // 2) Cinco personas la votan a favor
  for (const [i, email] of VOTERS.entries()) {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await login(page, email)
    await page.goto('#/validar')
    // Las pruebas salen en orden aleatorio: salta hasta encontrar la nuestra.
    await expect(page.getByRole('group', { name: 'Tu voto' })).toBeVisible()
    for (let k = 0; k < 15; k++) {
      if (await page.getByText(note).isVisible()) break
      if (!(await page.getByRole('button', { name: 'Saltar' }).isVisible())) break
      await page.getByRole('button', { name: 'Saltar' }).click()
    }
    await expect(page.getByText(note)).toBeVisible()
    await page.getByRole('button', { name: 'Reto superado' }).click()
    if (i < VOTERS.length - 1) {
      await expect(page.getByText('Voto a favor registrado 👍')).toBeVisible()
    } else {
      await expect(page.getByText('¡Con tu voto el reto queda superado! 🎉')).toBeVisible()
    }
    await ctx.close()
  }

  // 3) El autor ve el reto superado y la notificación
  await author.goto('#/notificaciones')
  await expect(
    author.getByRole('main').getByText(/Misión completada! “Jamón, jamón”/),
  ).toBeVisible()
  await author.goto('#/misiones')
  await author.getByRole('link', { name: /Jamón, jamón/ }).click()
  await expect(author.getByText('¡Ya completaste esta misión!')).toBeVisible()
  await authorCtx.close()
})

test('votar "No vale" registra el voto y muestra el progreso', async ({ page }) => {
  await login(page, 'usuario@fachapp.local')
  await page.goto('#/validar')
  await expect(page.getByRole('heading', { name: 'Validar retos' })).toBeVisible()
  const noVale = page.getByRole('button', { name: 'No vale' })
  await expect(noVale).toBeVisible()
  await expect(page.getByRole('progressbar', { name: 'Votos "No vale"' })).toBeVisible()
  await noVale.click()
  await expect(page.getByText('Voto en contra registrado 👎')).toBeVisible()
})
