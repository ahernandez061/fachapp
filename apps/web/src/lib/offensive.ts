// Filtro de lenguaje ofensivo en cliente (aviso rápido). La comprobación que cuenta
// está en la BD (public.contains_offensive + triggers), que usa la tabla banned_words.
const WORDS = [
  'gilipollas',
  'subnormal',
  'maricón',
  'maricon',
  'puta',
  'zorra',
  'hijo de puta',
  'hijoputa',
  'retrasado',
  'mongolo',
  'sudaca',
  'moro de mierda',
  'panchito',
  'negrata',
  'tortillera',
  'bollera',
  'cabrón',
  'cabron',
  'mamón',
  'mamon',
  'capullo',
  'imbécil',
  'imbecil',
  'malnacido',
  'muérete',
  'muerete',
]

const pattern = new RegExp(
  `(^|[^\\p{L}\\p{N}])(${WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\p{L}\\p{N}])`,
  'iu',
)

export function containsOffensive(text: string) {
  return pattern.test(text)
}

export const OFFENSIVE_MESSAGE =
  'El texto contiene lenguaje ofensivo. Revisa las normas de la comunidad.'
