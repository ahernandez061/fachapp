#!/usr/bin/env node
// Genera los iconos PNG (PWA y Capacitor) a partir de apps/web/public/logo.svg
// renderizándolo con Playwright (no necesita sharp ni ImageMagick).
//   node scripts/icons.mjs
import { chromium } from '@playwright/test'
import { mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pub = path.join(root, 'apps/web/public')
const svg = readFileSync(path.join(pub, 'logo.svg'), 'utf8')
const assets = path.join(root, 'apps/web/assets')
mkdirSync(path.join(pub, 'icons'), { recursive: true })
mkdirSync(assets, { recursive: true })

const targets = [
  { file: path.join(pub, 'icons/icon-192.png'), size: 192, pad: 0, bg: 'transparent' },
  { file: path.join(pub, 'icons/icon-512.png'), size: 512, pad: 0, bg: 'transparent' },
  // Maskable: el contenido debe caber en el 80 % central.
  { file: path.join(pub, 'icons/maskable-512.png'), size: 512, pad: 0.12, bg: '#c2410c' },
  { file: path.join(pub, 'apple-touch-icon.png'), size: 180, pad: 0.08, bg: '#c2410c' },
  // Fuentes para @capacitor/assets (Fase 7)
  { file: path.join(assets, 'icon-only.png'), size: 1024, pad: 0.1, bg: '#c2410c' },
  { file: path.join(assets, 'splash.png'), size: 2732, pad: 0.4, bg: '#fafaf9' },
  { file: path.join(assets, 'splash-dark.png'), size: 2732, pad: 0.4, bg: '#1c1917' },
]

const browser = await chromium.launch({
  channel: process.env.CI ? undefined : (process.env.PW_CHANNEL ?? 'msedge'),
})
const page = await browser.newPage()
for (const t of targets) {
  await page.setViewportSize({ width: t.size, height: t.size })
  const inner = Math.round(t.size * (1 - 2 * t.pad))
  await page.setContent(
    `<html><body style="margin:0;display:grid;place-items:center;width:${t.size}px;height:${t.size}px;background:${t.bg}">
      <div style="width:${inner}px;height:${inner}px">${svg.replace('<svg', '<svg width="100%" height="100%"')}</div>
    </body></html>`,
  )
  await page.screenshot({ path: t.file, omitBackground: t.bg === 'transparent' })
  console.log('✓', path.relative(root, t.file))
}
await browser.close()
