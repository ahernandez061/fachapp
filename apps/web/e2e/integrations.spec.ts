import { expect, test } from '@playwright/test'
import { LUCIA, login, newUser } from './helpers'

// Los proveedores OAuth reales (Google, Apple, X) necesitan credenciales: aquí se comprueba
// que la app pide la autorización correcta a Supabase Auth, interceptando la redirección.
test.describe('login con Google, Apple y X', () => {
  for (const [label, provider] of [
    ['Google', 'google'],
    ['Apple', 'apple'],
    ['X', 'x'],
  ] as const) {
    test(`"Continuar con ${label}" pide autorización a ${provider}`, async ({ page }) => {
      let authorize: URL | null = null
      await page.route('**/auth/v1/authorize**', (route) => {
        authorize = new URL(route.request().url())
        return route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<p>OAuth simulado</p>',
        })
      })
      await page.goto('#/entrar')
      await page.getByRole('button', { name: `Continuar con ${label}` }).click()
      await expect.poll(() => authorize?.searchParams.get('provider')).toBe(provider)
      expect(authorize!.searchParams.get('redirect_to')).toContain('/fachapp/')
      // PKCE: el código se canjea al volver
      expect(authorize!.searchParams.get('code_challenge_method')).toBe('s256')
      if (provider === 'apple') expect(authorize!.searchParams.get('scopes')).toBe('name email')
    })
  }
})

test('cuentas vinculadas: lista los métodos y pide vincular Apple', async ({ page }) => {
  await login(page, LUCIA)
  let linkRequest: URL | null = null
  await page.route('**/auth/v1/user/identities/authorize**', (route) => {
    linkRequest = new URL(route.request().url())
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ url: `${new URL(page.url()).origin}/fachapp/#/ajustes` }),
    })
  })
  await page.goto('#/ajustes')
  const list = page.getByRole('list', { name: 'Cuentas vinculadas' })
  await expect(list.getByText('lucia@fachapp.local')).toBeVisible()
  for (const name of ['Google', 'Apple', 'X']) {
    await expect(list.getByRole('listitem', { name, exact: true })).toBeVisible()
  }
  await list
    .getByRole('listitem', { name: 'Apple', exact: true })
    .getByRole('button', { name: 'Vincular' })
    .click()
  await expect.poll(() => linkRequest?.searchParams.get('provider')).toBe('apple')
})

test('Instagram en el perfil: se guarda normalizado y enlaza al perfil', async ({ page }) => {
  const username = await newUser(page)
  await page.goto('#/editar-perfil')
  const field = page.getByLabel('Instagram (opcional)')
  await field.fill('esto no vale')
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText('Usuario de Instagram no válido')).toBeVisible()

  await field.fill('https://www.instagram.com/Fach.Prueba/')
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page).toHaveURL(new RegExp(`#/u/${username}`))
  const link = page.getByRole('link', { name: /Instagram de .*: @fach\.prueba/ })
  await expect(link).toHaveAttribute('href', 'https://www.instagram.com/fach.prueba/')
  await expect(link).toHaveAttribute('target', '_blank')
})

test('compartir una publicación copia el enlace si no hay hoja de compartir', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })
    const copied: string[] = []
    Object.defineProperty(window, '__copied', { value: copied })
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: async (t: string) => void copied.push(t) },
      configurable: true,
    })
  })
  await login(page, LUCIA)
  await page.goto('#/?tab=discover')
  await page.getByRole('article').first().getByRole('button', { name: 'Compartir' }).click()
  await expect(page.getByText('Enlace copiado')).toBeVisible()
  const copied = await page.evaluate(() => (window as unknown as { __copied: string[] }).__copied)
  expect(copied[0]).toMatch(/\/fachapp\/#\/p\/[0-9a-f-]{36}$/)
})

test('invitar amigos por Gmail y por correo', async ({ page }) => {
  await login(page, LUCIA)
  await page.goto('#/ajustes')
  const gmail = page.getByRole('link', { name: 'Invitar por Gmail' })
  const href = new URL((await gmail.getAttribute('href'))!)
  expect(href.hostname).toBe('mail.google.com')
  expect(href.searchParams.get('su')).toContain('FachApp')
  expect(href.searchParams.get('body')).toContain('Lucía Romero te invita')
  await expect(page.getByRole('link', { name: 'Otro correo' })).toHaveAttribute('href', /^mailto:/)
})

test('mencionar a alguien con @ le envía una notificación', async ({ browser }) => {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await newUser(page)
  const text = `Hola @lucia_sev, ¿hacemos el reto de la tortilla? ${Date.now()}`
  await page.getByRole('link', { name: 'Subir' }).click()
  await page.getByLabel('¿Qué quieres subir?').selectOption({ label: 'Publicación libre' })
  await page.getByLabel('Texto').fill(text)
  await page.getByRole('button', { name: 'Publicar' }).click()
  await expect(page.getByText('Publicado')).toBeVisible()
  // La mención se ve como enlace al perfil
  await expect(
    page
      .getByRole('article')
      .filter({ hasText: text.slice(-13) })
      .getByRole('link', { name: '@lucia_sev' }),
  ).toHaveAttribute('href', '#/u/lucia_sev')
  await ctx.close()

  const ctx2 = await browser.newContext()
  const lucia = await ctx2.newPage()
  await login(lucia, LUCIA)
  await lucia.goto('#/notificaciones')
  await expect(
    lucia
      .getByRole('main')
      .getByText(/te ha mencionado: “Hola @lucia_sev/)
      .first(),
  ).toBeVisible()
  await ctx2.close()
})
