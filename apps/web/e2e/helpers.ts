import { expect, type Page } from '@playwright/test'
import { deflateSync } from 'node:zlib'

export const PASSWORD = 'fachapp123'
export const ADMIN = 'admin@fachapp.local'
export const LUCIA = 'lucia@fachapp.local'

export const uniqueEmail = (prefix = 'e2e') =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@fachapp.local`

export async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto('#/entrar')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible()
}

export async function register(page: Page, email: string) {
  await page.goto('#/registro')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD)
  await page.getByLabel('Repite la contraseña').fill(PASSWORD)
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.getByRole('heading', { name: 'Completa tu perfil' })).toBeVisible()
}

export async function completeOnboarding(page: Page, username: string, birthdate = '2000-05-15') {
  await page.getByLabel('Nombre de usuario').fill(username)
  await page.getByLabel('Nombre visible').fill(`Prueba ${username}`)
  await page.getByLabel('Provincia').selectOption('M')
  await page.getByLabel('Fecha de nacimiento').fill(birthdate)
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Empezar' }).click()
}

export async function newUser(page: Page) {
  const username = `e2e_${Date.now().toString(36)}${Math.floor(Math.random() * 100)}`
  await register(page, uniqueEmail())
  await completeOnboarding(page, username)
  await expect(page.getByRole('heading', { name: 'Misiones' })).toBeVisible()
  return username
}

// ---------------------------------------------------------------------------
// PNG de prueba generado al vuelo (sin ficheros binarios en el repo)
// ---------------------------------------------------------------------------
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
function crc32(buf: Buffer) {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

/** Imagen PNG con un degradado (atardecer) de `size`×`size`. */
export function testPng(size = 256) {
  const raw = Buffer.alloc((size * 3 + 1) * size)
  for (let y = 0; y < size; y++) {
    const row = y * (size * 3 + 1)
    raw[row] = 0
    for (let x = 0; x < size; x++) {
      const i = row + 1 + x * 3
      raw[i] = 255
      raw[i + 1] = Math.round(80 + (120 * y) / size)
      raw[i + 2] = Math.round((60 * x) / size)
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}
