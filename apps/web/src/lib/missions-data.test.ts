import { parseRule } from '@shared/rules'
// @ts-expect-error módulo JS sin tipos (fuente única de misiones para los seeds)
import { MISSIONS } from '../../../../scripts/missions-data.mjs'

type M = {
  n: number
  title: string
  description: string
  category: string
  type: 'photo' | 'manual' | 'x_auto'
  rules?: unknown
  featured?: boolean
  starts?: string
  ends?: string
  points: number
}
const missions = MISSIONS as M[]

describe('misiones del seed (scripts/missions-data.mjs)', () => {
  it('tienen números únicos', () => {
    const ns = missions.map((m) => m.n)
    expect(new Set(ns).size).toBe(ns.length)
  })

  it('hay exactamente un Reto de la semana y es la foto con la bandera', () => {
    const featured = missions.filter((m) => m.featured)
    expect(featured.map((m) => m.title)).toEqual(['Foto con la bandera de España'])
  })

  it('incluyen los retos pedidos: bandera, selfie con alguien del PP y #España en X', () => {
    const titles = missions.map((m) => m.title)
    expect(titles).toContain('Selfie con alguien del PP')
    const espana = missions.find((m) => m.title === '#España en X')
    expect(espana?.type).toBe('x_auto')
    expect(parseRule(espana?.rules)).toMatchObject({
      type: 'post_with_hashtag',
      hashtag: '#España',
    })
  })

  it('todas las reglas x_auto son válidas', () => {
    for (const m of missions.filter((m) => m.type === 'x_auto')) {
      expect(() => parseRule(m.rules), m.title).not.toThrow()
    }
  })

  it('las fechas de inicio son anteriores a las de fin', () => {
    for (const m of missions.filter((m) => m.starts && m.ends)) {
      expect(new Date(m.starts!).getTime(), m.title).toBeLessThan(new Date(m.ends!).getTime())
    }
  })

  it('todas tienen descripción y puntos razonables', () => {
    for (const m of missions) {
      expect(m.description.length, m.title).toBeGreaterThan(20)
      expect(m.points, m.title).toBeGreaterThan(0)
      expect(m.points, m.title).toBeLessThanOrEqual(300)
    }
  })
})
