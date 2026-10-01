#!/usr/bin/env node
// Compila el APK de depuración dentro de Docker (imagen de apps/web/android.Dockerfile).
// Lo usa `npm run android:apk -w @fachapp/web`. Resultado: apps/web/android/app/build/outputs/apk/debug/
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const r = spawnSync(
  'docker',
  [
    'run',
    '--rm',
    '-v',
    `${root}:/repo`,
    '-v',
    'fachapp-gradle-cache:/root/.gradle',
    'fachapp-android-builder',
    'sh',
    '-c',
    "sed -i 's/\\r$//' gradlew && chmod +x gradlew && ./gradlew assembleDebug --no-daemon -q",
  ],
  { stdio: 'inherit', env: { ...process.env, MSYS_NO_PATHCONV: '1' } },
)
if (r.status === 0) console.log('✓ APK: apps/web/android/app/build/outputs/apk/debug/app-debug.apk')
process.exit(r.status ?? 1)
