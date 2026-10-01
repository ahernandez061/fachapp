import { formatDate, formatNumber, formatRelative } from './i18n'

describe('i18n es-ES / Europe/Madrid', () => {
  it('formatea fechas en español con la zona horaria de Madrid', () => {
    // 23:30 UTC del 30 sep = 1:30 del 1 oct en Madrid (CEST, UTC+2)
    expect(formatDate('2026-09-30T23:30:00Z')).toBe('1 de octubre de 2026')
  })

  it('usa el separador de miles español', () => {
    expect(formatNumber(1234567)).toBe('1.234.567')
  })

  it('formatea tiempos relativos', () => {
    const now = new Date('2026-10-01T12:00:00Z')
    expect(formatRelative(new Date('2026-10-01T11:55:00Z'), now)).toBe('hace 5 minutos')
    expect(formatRelative(new Date('2026-09-30T12:00:00Z'), now)).toBe('ayer')
    expect(formatRelative(now, now)).toBe('ahora')
  })
})
