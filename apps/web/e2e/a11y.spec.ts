import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { LUCIA, login } from './helpers'

// WCAG 2.1 AA: sin violaciones graves o críticas en las pantallas principales.
const pages = [
  '#/',
  '#/misiones',
  '#/misiones/10000000-0000-4000-a000-000000000004',
  '#/subir',
  '#/ranking',
  '#/u/lucia_sev',
  '#/notificaciones',
  '#/ajustes',
  '#/explorar',
  '#/validar',
  '#/premios',
  '#/explorar?tab=gente',
  '#/explorar/tag/concebolla',
]

test.describe('accesibilidad', () => {
  test('pantallas públicas', async ({ page }) => {
    for (const path of ['#/bienvenida', '#/entrar', '#/registro', '#/legal/privacidad']) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
      const serious = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
      expect(serious.map((v) => `${path}: ${v.id} (${v.nodes.length})`)).toEqual([])
    }
  })

  test('pantallas con sesión', async ({ page }) => {
    await login(page, LUCIA)
    for (const path of pages) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(300)
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
      const serious = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
      expect(serious.map((v) => `${path}: ${v.id} → ${v.nodes[0]?.target}`)).toEqual([])
    }
  })
})
