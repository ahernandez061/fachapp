// Niveles: el nivel n requiere 50·n·(n−1) puntos → 0, 100, 300, 600, 1000…
// Debe coincidir con public.level_for_points() en la BD.

export function pointsForLevel(level: number) {
  return 50 * level * (level - 1)
}

export function levelForPoints(points: number) {
  return Math.max(1, Math.floor((1 + Math.sqrt(1 + (8 * Math.max(points, 0)) / 100)) / 2))
}

export function levelProgress(points: number) {
  const level = levelForPoints(points)
  const from = pointsForLevel(level)
  const to = pointsForLevel(level + 1)
  return {
    level,
    from,
    to,
    remaining: to - points,
    percent: Math.round(((points - from) / (to - from)) * 100),
  }
}

const TITLES = [
  'Novato',
  'Aprendiz',
  'Explorador',
  'Aventurero',
  'Veterano',
  'Experto',
  'Maestro',
  'Leyenda',
]

export function levelTitle(level: number) {
  return TITLES[Math.min(level, TITLES.length) - 1]
}
