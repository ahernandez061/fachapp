import { expect, test } from '@playwright/test'
import { completeOnboarding, LUCIA, login, register, uniqueEmail } from './helpers'

test('sin sesión redirige a la bienvenida', async ({ page }) => {
  await page.goto('#/ranking')
  await expect(page).toHaveURL(/#\/bienvenida/)
  await expect(page.getByRole('heading', { name: 'Completa misiones' })).toBeVisible()
})

test('registro + onboarding bloquea a menores de 14 años', async ({ page }) => {
  await register(page, uniqueEmail())
  const username = `e2e_${Date.now().toString(36)}`
  const year = new Date().getFullYear() - 13
  await completeOnboarding(page, username, `${year}-06-01`)
  await expect(page.getByText('Debes tener al menos 14 años para usar FachApp')).toBeVisible()

  await page.getByLabel('Fecha de nacimiento').fill('2001-03-20')
  await page.getByRole('button', { name: 'Empezar' }).click()
  await expect(page.getByRole('heading', { name: 'Misiones' })).toBeVisible()

  await page.getByRole('link', { name: 'Perfil' }).click()
  await expect(page.getByRole('heading', { name: `Prueba ${username}` })).toBeVisible()
})

test('login incorrecto muestra un error amable', async ({ page }) => {
  await page.goto('#/entrar')
  await page.getByLabel('Email').fill(LUCIA)
  await page.getByLabel('Contraseña').fill('mala-contraseña')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByText('Email o contraseña incorrectos.')).toBeVisible()
})

test('login y cierre de sesión', async ({ page }) => {
  await login(page, LUCIA)
  await page.goto('#/ajustes')
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/#\/bienvenida/)
})
