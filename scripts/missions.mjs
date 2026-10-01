#!/usr/bin/env node
// Fuente única de las misiones de FachApp (todas con temática española).
// Genera:
//   - el bloque entre "-- @missions:start" y "-- @missions:end" de supabase/seed.sql (con ids fijos)
//   - supabase/seed-production.sql (sin ids ni usuarios, para la nube)
//   node scripts/missions.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
import { MISSIONS, pic } from './missions-data.mjs'

const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`)
const id = (n) => `'10000000-0000-4000-a000-${String(n).padStart(12, '0')}'`
const ADMIN = "'00000000-0000-4000-a000-000000000001'"

function row(m, withId) {
  const cols = [
    q(m.title),
    q(m.description),
    q(m.category),
    q(m.difficulty),
    m.points,
    q(m.type),
    q(JSON.stringify(m.rules ?? {})),
    q(m.starts),
    q(m.ends),
    q(pic(m.cover)),
    m.featured ? 'true' : 'false',
  ]
  return `  (${withId ? `${id(m.n)}, ` : ''}${cols.join(', ')}${withId ? `, ${ADMIN}` : ''})`
}

const COLS =
  'title, description, category, difficulty, points, verification_type, rules, starts_at, ends_at, cover_image, featured'

// Comprobación: ids únicos
const ns = MISSIONS.map((m) => m.n)
if (new Set(ns).size !== ns.length) throw new Error('Hay números de misión repetidos')

const seedBlock = `-- @missions:start (generado por scripts/missions.mjs, no editar a mano)
insert into public.missions (id, ${COLS}, created_by) values
${MISSIONS.map((m) => row(m, true)).join(',\n')};
-- @missions:end`

const seedFile = path.join(root, 'supabase', 'seed.sql')
const seed = readFileSync(seedFile, 'utf8')
const re = /-- @missions:start[\s\S]*?-- @missions:end/
if (!re.test(seed)) throw new Error('No encuentro los marcadores @missions en seed.sql')
writeFileSync(seedFile, seed.replace(re, seedBlock))

writeFileSync(
  path.join(root, 'supabase', 'seed-production.sql'),
  `-- Misiones iniciales para un proyecto REAL (producción o pruebas con amigos).
-- Generado por scripts/missions.mjs. NO crea usuarios ni contraseñas conocidas.
-- Lo carga \`npm run cloud:migrate\` (solo si la tabla de misiones está vacía).
insert into public.missions (${COLS}) values
${MISSIONS.map((m) => row(m, false)).join(',\n')};
`,
)
console.log(`✓ ${MISSIONS.length} misiones → supabase/seed.sql y supabase/seed-production.sql`)
