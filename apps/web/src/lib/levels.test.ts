import { levelForPoints, levelProgress, levelTitle, pointsForLevel } from './levels'

describe('niveles', () => {
  it('umbrales 0, 100, 300, 600, 1000', () => {
    expect([1, 2, 3, 4, 5].map(pointsForLevel)).toEqual([0, 100, 300, 600, 1000])
  })

  it.each([
    [0, 1],
    [99, 1],
    [100, 2],
    [299, 2],
    [300, 3],
    [599, 3],
    [600, 4],
    [1000, 5],
    [-5, 1],
  ])('%i puntos → nivel %i', (pts, lvl) => {
    expect(levelForPoints(pts)).toBe(lvl)
  })

  it('progreso dentro del nivel', () => {
    expect(levelProgress(200)).toEqual({
      level: 2,
      from: 100,
      to: 300,
      remaining: 100,
      percent: 50,
    })
  })

  it('títulos', () => {
    expect(levelTitle(1)).toBe('Novato')
    expect(levelTitle(99)).toBe('Leyenda')
  })
})
