import { expect, test } from '@playwright/test'
import { newUser } from './helpers'

test('seguir, feed, like, comentario y ranking', async ({ page }) => {
  await newUser(page)

  // Feed "Siguiendo" vacío → buscar a Lucía y seguirla
  await page.getByRole('link', { name: 'Feed' }).click()
  await expect(page.getByText('Aún no sigues a nadie')).toBeVisible()
  await page.getByRole('link', { name: 'Explorar' }).click()
  await page.getByRole('tab', { name: 'Gente' }).click()
  await page.getByRole('searchbox').fill('lucia')
  const row = page.getByRole('listitem').filter({ hasText: '@lucia_sev' })
  await row.getByRole('button', { name: 'Seguir' }).click()
  await expect(row.getByRole('button', { name: 'Siguiendo' })).toBeVisible()

  // Ahora el feed muestra sus publicaciones
  await page.getByRole('link', { name: 'Feed' }).click()
  const post = page.getByRole('article', { name: 'Publicación de Lucía Romero' }).first()
  await expect(post).toBeVisible()

  // Like optimista
  const like = post.getByRole('button', { name: 'Me gusta' })
  await like.click()
  await expect(post.getByRole('button', { name: 'Quitar me gusta' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  // Comentario (y el filtro ofensivo)
  await post.getByRole('link', { name: /Comentarios/ }).click()
  const box = page.getByLabel('Escribe un comentario')
  await box.fill('eres un gilipollas')
  await page.getByRole('button', { name: 'Enviar comentario' }).click()
  await expect(page.getByText(/lenguaje ofensivo/)).toBeVisible()
  await box.fill('¡Qué buena foto! 👏')
  await page.getByRole('button', { name: 'Enviar comentario' }).click()
  await expect(page.getByText('¡Qué buena foto! 👏')).toBeVisible()

  // Ranking de amigos incluye a Lucía
  await page.getByRole('link', { name: 'Ranking' }).click()
  await page.getByRole('tab', { name: 'Amigos' }).click()
  await expect(
    page.getByRole('list', { name: 'Ranking amigos' }).getByText('Lucía Romero'),
  ).toBeVisible()
})

test('reportar una publicación', async ({ page }) => {
  await newUser(page)
  await page.goto('#/?tab=discover')
  const post = page.getByRole('article').first()
  await post.getByRole('button', { name: 'Más opciones' }).click()
  await page.getByRole('menuitem', { name: 'Reportar' }).click()
  await page.getByLabel('Spam').check()
  await page.getByRole('button', { name: 'Enviar reporte' }).click()
  await expect(page.getByText('Gracias. El equipo de moderación lo revisará.')).toBeVisible()
})

test('exportar datos (RGPD)', async ({ page }) => {
  await newUser(page)
  await page.goto('#/ajustes')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar mis datos (JSON)' }).click()
  const file = await download
  expect(file.suggestedFilename()).toMatch(/^fachapp-mis-datos-.*\.json$/)
})

test('borrar la cuenta', async ({ page }) => {
  await newUser(page)
  await page.goto('#/ajustes')
  await page.getByRole('button', { name: 'Eliminar mi cuenta' }).click()
  const confirm = page.getByRole('button', { name: 'Eliminar definitivamente' })
  await expect(confirm).toBeDisabled()
  await page.getByLabel('Escribe ELIMINAR para confirmar').fill('ELIMINAR')
  await confirm.click()
  await expect(page).toHaveURL(/#\/bienvenida/)
})
