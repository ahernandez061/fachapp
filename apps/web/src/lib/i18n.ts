// Utilidades de formato para España: idioma es-ES y zona horaria Europe/Madrid.
export const LOCALE = 'es-ES'
export const TIME_ZONE = 'Europe/Madrid'

const dateFmt = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const dateTimeFmt = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

const numberFmt = new Intl.NumberFormat(LOCALE)
const relativeFmt = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' })

type DateInput = Date | string | number

const toDate = (d: DateInput) => (d instanceof Date ? d : new Date(d))

/** "1 de octubre de 2026" */
export function formatDate(d: DateInput) {
  return dateFmt.format(toDate(d))
}

/** "1 oct, 14:30" */
export function formatDateTime(d: DateInput) {
  return dateTimeFmt.format(toDate(d))
}

/** "12.345" (separador de miles español) */
export function formatNumber(n: number) {
  return numberFmt.format(n)
}

const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
]

/** "hace 5 minutos", "ayer", "ahora" */
export function formatRelative(d: DateInput, now: DateInput = Date.now()) {
  const diff = (toDate(d).getTime() - toDate(now).getTime()) / 1000
  for (const [unit, secs] of units) {
    if (Math.abs(diff) >= secs) return relativeFmt.format(Math.round(diff / secs), unit)
  }
  return 'ahora'
}
