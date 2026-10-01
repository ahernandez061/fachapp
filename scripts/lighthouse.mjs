#!/usr/bin/env node
// Auditoría Lighthouse (móvil) del build de producción servido con `vite preview`.
//   npm run build && npm run preview   (en otra terminal)
//   node scripts/lighthouse.mjs [url]
// Lanza el navegador con Playwright (Edge/Chrome instalado) y conecta Lighthouse por CDP.
import { chromium } from '@playwright/test'
import lighthouse from 'lighthouse'
import { writeFileSync } from 'node:fs'

const url = process.argv[2] ?? 'http://localhost:4180/fachapp/#/bienvenida'
const port = 9333
const browser = await chromium.launch({
  channel: process.env.CI ? undefined : (process.env.PW_CHANNEL ?? 'msedge'),
  args: [`--remote-debugging-port=${port}`],
})
try {
  const result = await lighthouse(url, { port, output: 'html', logLevel: 'error' })
  writeFileSync('lighthouse-report.html', result.report)
  let ok = true
  for (const [k, c] of Object.entries(result.lhr.categories)) {
    const score = Math.round(c.score * 100)
    if (score < 90) ok = false
    console.log(`${score >= 90 ? '✓' : '✗'} ${k.padEnd(16)} ${score}`)
  }
  console.log('Informe: lighthouse-report.html')
  process.exitCode = ok ? 0 : 1
} finally {
  await browser.close()
}
