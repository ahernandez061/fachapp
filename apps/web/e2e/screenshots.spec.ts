// Genera las capturas de docs/capturas con `npm run docs:screens`.
import { expect, test, type Page } from '@playwright/test'
import path from 'node:path'
import { ADMIN, LUCIA, login } from './helpers'

const out = (name: string) =>
  path.resolve(import.meta.dirname, '../../../docs/capturas', `${name}.png`)

async function shot(page: Page, name: string) {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(600)
  await page.screenshot({ path: out(name) })
}

test.use({ viewport: { width: 412, height: 860 } })

test('capturas públicas', async ({ page }) => {
  await page.goto('#/bienvenida')
  await shot(page, '01-bienvenida')
  await page.goto('#/entrar')
  await shot(page, '02-entrar')
})

test('capturas de la app', async ({ page }) => {
  await login(page, LUCIA)
  const screens: [string, string][] = [
    ['#/', '03-feed'],
    ['#/?tab=discover', '04-descubrir'],
    ['#/misiones', '05-misiones'],
    ['#/misiones/10000000-0000-4000-a000-000000000003', '06-mision-x'],
    ['#/misiones/10000000-0000-4000-a000-000000000009', '07-mision-foto'],
    ['#/subir?mision=10000000-0000-4000-a000-000000000009', '08-subir'],
    ['#/u/lucia_sev', '09-perfil'],
    ['#/ranking', '10-ranking'],
    ['#/notificaciones', '11-notificaciones'],
    ['#/conectar-x', '12-conectar-x'],
    ['#/ajustes', '13-ajustes'],
  ]
  for (const [url, name] of screens) {
    await page.goto(url)
    await shot(page, name)
  }
  // Red social: Explorar, hashtag y visor de la galería
  await page.goto('#/explorar')
  await shot(page, '19-explorar')
  await page.goto('#/explorar/tag/croquetas')
  await shot(page, '20-hashtag')
  await page.goto('#/u/lucia_sev')
  await page
    .getByRole('list', { name: 'Galería de Lucía Romero' })
    .getByRole('button')
    .first()
    .click()
  await shot(page, '21-visor-galeria')
  await page.keyboard.press('Escape')

  await page.goto('#/validar')
  await shot(page, '22-validar')
  await page.goto('#/premios')
  await shot(page, '23-premios')

  // Modo oscuro
  await page.evaluate(() =>
    localStorage.setItem('fachapp-theme', JSON.stringify({ state: { theme: 'dark' }, version: 0 })),
  )
  await page.goto('#/')
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await shot(page, '14-feed-oscuro')
})

test('captura del panel de admin', async ({ page }) => {
  await login(page, ADMIN)
  await page.goto('#/admin')
  await shot(page, '15-admin')
  await page.getByRole('tab', { name: /Usuarios/ }).click()
  await shot(page, '16-admin-usuarios')
  await page.getByRole('tab', { name: /Misiones/ }).click()
  await page.getByRole('button', { name: 'Nueva misión' }).click()
  await shot(page, '17-admin-nueva-mision')
})

test('captura del usuario demo', async ({ page }) => {
  await page.goto('#/entrar')
  await page.getByRole('button', { name: 'Entrar como usuario' }).click()
  await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible()
  await page.goto('#/u/usuario_demo')
  await expect(page.getByRole('heading', { name: 'Usuario Demo' })).toBeVisible()
  await shot(page, '18-perfil-usuario-demo')
})
