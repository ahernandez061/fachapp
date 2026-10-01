#!/usr/bin/env node
// Utilidades para el Supabase local en Docker (alternativa a `supabase start`).
//
//   node scripts/sb.mjs setup     genera supabase/docker/.env y apps/web/.env.local
//   node scripts/sb.mjs start     docker compose up -d y espera a que la API responda
//   node scripts/sb.mjs stop      docker compose down
//   node scripts/sb.mjs migrate   aplica las migraciones pendientes de supabase/migrations
//   node scripts/sb.mjs seed      ejecuta supabase/seed.sql
//   node scripts/sb.mjs reset     borra los datos, arranca, migra y siembra
//   node scripts/sb.mjs types     genera apps/web/src/lib/database.types.ts
//   node scripts/sb.mjs sql "<sql>"  ejecuta SQL como postgres
import { execFileSync, spawnSync } from 'node:child_process'
import { createHmac, randomBytes } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dockerDir = path.join(root, 'supabase', 'docker')
const envFile = path.join(dockerDir, '.env')
const webEnvFile = path.join(root, 'apps', 'web', '.env.local')
const API_URL = 'http://localhost:54321'

const b64url = (buf) => Buffer.from(buf).toString('base64url')

function signJwt(payload, secret) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = b64url(JSON.stringify(payload))
  const sig = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${sig}`
}

function readEnv() {
  if (!existsSync(envFile))
    throw new Error('Falta supabase/docker/.env. Ejecuta `npm run sb:setup`.')
  return Object.fromEntries(
    readFileSync(envFile, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
  )
}

function compose(...args) {
  const r = spawnSync('docker', ['compose', ...args], { cwd: dockerDir, stdio: 'inherit' })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

function psql(sql, { quiet = false } = {}) {
  return execFileSync(
    'docker',
    [
      'compose',
      'exec',
      '-T',
      'db',
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
      '-q',
      '-t',
      '-A',
    ],
    {
      cwd: dockerDir,
      input: sql,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', quiet ? 'pipe' : 'inherit'],
    },
  )
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitForApi(timeoutMs = 600_000) {
  const { SERVICE_ROLE_KEY } = readEnv()
  const service = { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` }
  const start = Date.now()
  process.stdout.write('Esperando a la API de Supabase')
  while (Date.now() - start < timeoutMs) {
    try {
      const [rest, auth, storage] = await Promise.all([
        fetch(`${API_URL}/rest/v1/`, { headers: service }),
        fetch(`${API_URL}/auth/v1/health`, { headers: service }),
        fetch(`${API_URL}/storage/v1/bucket`, { headers: service }),
      ])
      if (rest.ok && auth.ok && storage.ok) {
        console.log(' ✓')
        return
      }
    } catch {
      /* aún arrancando */
    }
    process.stdout.write('.')
    await sleep(3000)
  }
  throw new Error('La API no respondió a tiempo. Revisa `docker compose logs` en supabase/docker.')
}

function setup() {
  if (existsSync(envFile)) {
    console.log('supabase/docker/.env ya existe (no se sobrescribe).')
  } else {
    const jwtSecret = randomBytes(32).toString('hex')
    const iat = Math.floor(Date.now() / 1000)
    const exp = iat + 60 * 60 * 24 * 365 * 10
    const anon = signJwt({ role: 'anon', iss: 'supabase', iat, exp }, jwtSecret)
    const service = signJwt({ role: 'service_role', iss: 'supabase', iat, exp }, jwtSecret)
    const env = {
      POSTGRES_PASSWORD: randomBytes(16).toString('hex'),
      JWT_SECRET: jwtSecret,
      ANON_KEY: anon,
      SERVICE_ROLE_KEY: service,
      SECRET_KEY_BASE: randomBytes(48).toString('base64url'),
      PG_META_CRYPTO_KEY: randomBytes(24).toString('hex'),
      DASHBOARD_USERNAME: 'supabase',
      DASHBOARD_PASSWORD: randomBytes(9).toString('base64url'),
      SUPABASE_PUBLIC_URL: API_URL,
      SITE_URL: 'http://localhost:5180/fachapp/',
      ADDITIONAL_REDIRECT_URLS: 'http://localhost:5180/fachapp/**,http://localhost:4180/fachapp/**',
      X_MOCK: 'true',
      X_TOKEN_ENCRYPTION_KEY: randomBytes(32).toString('base64'),
      X_ENABLED: 'false',
      X_CLIENT_ID: '',
      X_CLIENT_SECRET: '',
      GOOGLE_ENABLED: 'false',
      GOOGLE_CLIENT_ID: '',
      GOOGLE_SECRET: '',
    }
    writeFileSync(
      envFile,
      '# Generado por scripts/sb.mjs — SOLO para desarrollo local. No subir.\n' +
        Object.entries(env)
          .map(([k, v]) => `${k}=${v}`)
          .join('\n') +
        '\n',
    )
    console.log('✓ supabase/docker/.env generado')
  }
  if (existsSync(webEnvFile)) {
    console.log('apps/web/.env.local ya existe (no se sobrescribe).')
  } else {
    const { ANON_KEY } = readEnv()
    writeFileSync(
      webEnvFile,
      `VITE_SUPABASE_URL=${API_URL}\nVITE_SUPABASE_ANON_KEY=${ANON_KEY}\nVITE_X_MOCK=true\nVITE_DEMO_ACCOUNTS=true\n`,
    )
    console.log('✓ apps/web/.env.local generado')
  }
}

function migrate() {
  psql(`create schema if not exists supabase_migrations;
        create table if not exists supabase_migrations.schema_migrations (version text primary key, name text, applied_at timestamptz default now());`)
  const applied = new Set(
    psql('select version from supabase_migrations.schema_migrations;').split('\n').filter(Boolean),
  )
  const dir = path.join(root, 'supabase', 'migrations')
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
  let count = 0
  for (const file of files) {
    const version = file.split('_')[0]
    if (applied.has(version)) continue
    process.stdout.write(`→ ${file} … `)
    const sql = readFileSync(path.join(dir, file), 'utf8')
    psql(
      `begin;\n${sql}\n;insert into supabase_migrations.schema_migrations(version, name) values ('${version}', '${file}');\ncommit;`,
    )
    console.log('ok')
    count++
  }
  // Secretos del Vault para que la BD pueda llamar a send-push (red interna de Docker).
  const { SERVICE_ROLE_KEY } = readEnv()
  psql(`select vault.create_secret(t.v, t.n) from (values
      ('http://api-gw:8000/functions/v1', 'functions_url'),
      ('${SERVICE_ROLE_KEY}', 'service_role_key')) as t(v, n)
    where not exists (select 1 from vault.secrets s where s.name = t.n);`)
  // PostgREST recarga el esquema para ver las nuevas tablas.
  psql("notify pgrst, 'reload schema';")
  console.log(count ? `✓ ${count} migraciones aplicadas` : '✓ Base de datos al día')
}

function seed() {
  psql(readFileSync(path.join(root, 'supabase', 'seed.sql'), 'utf8'))
  console.log('✓ seed aplicado')
}

async function types() {
  const { SERVICE_ROLE_KEY } = readEnv()
  const res = await fetch(`${API_URL}/pg/generators/typescript?included_schemas=public`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  })
  if (!res.ok)
    throw new Error(`No se pudieron generar los tipos: ${res.status} ${await res.text()}`)
  const out = path.join(root, 'apps', 'web', 'src', 'lib', 'database.types.ts')
  writeFileSync(out, '// Generado con `npm run db:types`. No editar a mano.\n' + (await res.text()))
  console.log('✓ apps/web/src/lib/database.types.ts')
}

const [cmd, ...rest] = process.argv.slice(2)
switch (cmd) {
  case 'setup':
    setup()
    break
  case 'start':
    setup()
    compose('up', '-d')
    await waitForApi()
    break
  case 'stop':
    compose('down')
    break
  case 'migrate':
    migrate()
    break
  case 'seed':
    seed()
    break
  case 'reset':
    setup()
    compose('down', '-v')
    compose('up', '-d')
    await waitForApi()
    migrate()
    seed()
    break
  case 'types':
    await types()
    break
  case 'cloud-migrate': {
    // Aplica supabase/migrations (y opcionalmente seed-production.sql) a un proyecto en la nube.
    //   SUPABASE_DB_URL="postgresql://postgres.<ref>:<password>@aws-...pooler.supabase.com:5432/postgres"
    const url = process.env.SUPABASE_DB_URL
    if (!url) throw new Error('Define SUPABASE_DB_URL (Supabase → Connect → Session pooler).')
    const dir = path.join(root, 'supabase', 'migrations')
    const files = readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .sort()
    const cloudPsql = (sql) => {
      const r = spawnSync(
        'docker',
        [
          'run',
          '--rm',
          '-i',
          'postgres:17-alpine',
          'psql',
          url,
          '-v',
          'ON_ERROR_STOP=1',
          '-q',
          '-t',
          '-A',
        ],
        {
          input: sql,
          encoding: 'utf8',
        },
      )
      if (r.status !== 0) throw new Error(r.stderr || 'psql falló')
      return r.stdout
    }
    cloudPsql(`create schema if not exists supabase_migrations;
      create table if not exists supabase_migrations.schema_migrations (version text primary key, statements text[], name text);`)
    const applied = new Set(
      cloudPsql('select version from supabase_migrations.schema_migrations;')
        .split('\n')
        .filter(Boolean),
    )
    for (const file of files) {
      const version = file.split('_')[0]
      if (applied.has(version)) continue
      process.stdout.write(`→ ${file} … `)
      cloudPsql(
        `begin;\n${readFileSync(path.join(dir, file), 'utf8')}\n;insert into supabase_migrations.schema_migrations(version, name) values ('${version}', '${file.replace(/\.sql$/, '')}');\ncommit;`,
      )
      console.log('ok')
    }
    if (rest.includes('--seed')) {
      const n = Number(cloudPsql('select count(*) from public.missions;').trim())
      if (n === 0) {
        cloudPsql(readFileSync(path.join(root, 'supabase', 'seed-production.sql'), 'utf8'))
        console.log('✓ misiones iniciales cargadas')
      } else console.log(`(ya hay ${n} misiones; no se cargan las iniciales)`)
    }
    console.log('✓ Proyecto en la nube al día')
    break
  }
  case 'cloud-functions': {
    // Despliega las Edge Functions con el CLI de Supabase dentro de Docker.
    //   SUPABASE_ACCESS_TOKEN=sbp_…  SUPABASE_PROJECT_REF=abcd…
    const { SUPABASE_ACCESS_TOKEN: token, SUPABASE_PROJECT_REF: ref } = process.env
    if (!token || !ref) throw new Error('Define SUPABASE_ACCESS_TOKEN y SUPABASE_PROJECT_REF.')
    const r = spawnSync(
      'docker',
      [
        'run',
        '--rm',
        '-v',
        `${root}:/repo`,
        '-w',
        '/repo',
        '-e',
        'SUPABASE_ACCESS_TOKEN',
        'node:22-alpine',
        'npx',
        '--yes',
        'supabase@latest',
        'functions',
        'deploy',
        // Por nombre: `main` es solo el router del runtime local de Docker.
        ...readdirSync(path.join(root, 'supabase', 'functions'), { withFileTypes: true })
          .filter((d) => d.isDirectory() && !d.name.startsWith('_') && d.name !== 'main')
          .map((d) => d.name),
        '--use-api',
        '--project-ref',
        ref,
      ],
      { stdio: 'inherit', env: { ...process.env, MSYS_NO_PATHCONV: '1' } },
    )
    process.exit(r.status ?? 1)
  }
  case 'check-functions': {
    // Comprobación de tipos de las Edge Functions con Deno (en Docker: no hace falta instalar Deno).
    const fnDir = path.join(root, 'supabase', 'functions')
    const entries = readdirSync(fnDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith('_') && d.name !== 'main')
      .map((d) => `${d.name}/index.ts`)
    const r = spawnSync(
      'docker',
      [
        'run',
        '--rm',
        '-v',
        `${fnDir}:/f`,
        '-w',
        '/f',
        'denoland/deno:latest',
        'deno',
        'check',
        '--quiet',
        '--config',
        'deno.jsonc',
        ...entries,
      ],
      { stdio: 'inherit', env: { ...process.env, MSYS_NO_PATHCONV: '1' } },
    )
    if (r.status === 0) console.log(`✓ ${entries.length} Edge Functions sin errores de tipos`)
    process.exit(r.status ?? 1)
  }
  case 'sql':
    process.stdout.write(psql(rest.join(' ')))
    break
  default:
    console.log('Uso: node scripts/sb.mjs <setup|start|stop|migrate|seed|reset|types|sql>')
    process.exit(1)
}
