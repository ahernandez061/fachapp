import type { Mission } from '@/lib/types'
import { categoriesOf, EMPTY_FILTERS, filterMissions } from './filters'

const m = (id: string, over: Partial<Mission>): Mission => ({
  id,
  title: id,
  description: '',
  category: 'general',
  difficulty: 'facil',
  points: 10,
  verification_type: 'photo',
  rules: {},
  starts_at: null,
  ends_at: null,
  active: true,
  cover_image: null,
  featured: false,
  created_by: null,
  created_at: '2026-01-01',
  ...over,
})

const missions = [
  m('atardecer', { title: 'Atardecer en tu ciudad', category: 'fotografía' }),
  m('ruta', { title: 'Ruta de 10 km', category: 'deporte', difficulty: 'media' }),
  m('hashtag', { title: 'Estrena el #FachApp', category: 'redes', verification_type: 'x_auto' }),
]
const attempts = new Map([
  ['atardecer', { status: 'verified' as const }],
  ['ruta', { status: 'pending' as const }],
])

describe('filterMissions', () => {
  it('sin filtros devuelve todo', () => {
    expect(filterMissions(missions, attempts, EMPTY_FILTERS)).toHaveLength(3)
  })

  it('busca sin tildes ni mayúsculas', () => {
    expect(
      filterMissions(missions, attempts, { ...EMPTY_FILTERS, q: 'FOTOGRAFIA' }).map((x) => x.id),
    ).toEqual(['atardecer'])
  })

  it('filtra por tipo y dificultad', () => {
    expect(filterMissions(missions, attempts, { ...EMPTY_FILTERS, type: 'x_auto' })).toHaveLength(1)
    expect(
      filterMissions(missions, attempts, { ...EMPTY_FILTERS, difficulty: 'media' })[0].id,
    ).toBe('ruta')
  })

  it('filtra por estado del usuario', () => {
    const ids = (status: typeof EMPTY_FILTERS.status) =>
      filterMissions(missions, attempts, { ...EMPTY_FILTERS, status }).map((x) => x.id)
    expect(ids('done')).toEqual(['atardecer'])
    expect(ids('pending')).toEqual(['ruta'])
    expect(ids('todo')).toEqual(['hashtag'])
  })
})

describe('categoriesOf', () => {
  it('ordena en español sin duplicados', () => {
    expect(categoriesOf([...missions, missions[0]])).toEqual(['deporte', 'fotografía', 'redes'])
  })
})
