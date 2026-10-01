// Iconos SVG propios de las insignias: medalla hexagonal + glifo.
import { cn } from '@/lib/utils'

const GLYPHS: Record<string, React.ReactNode> = {
  'first-step': (
    <path d="M26 40c0-6 4-8 4-14s-3-8-6-8-6 3-6 8 4 8 4 14zm12 4c0-5 3-6 3-11s-2-6-4-6-5 2-5 6 3 6 3 11z" />
  ),
  streak: (
    <path d="M32 14c2 6 10 9 10 19a10 10 0 0 1-20 0c0-4 2-7 4-9 0 3 1 5 3 6 0-6 1-11 3-16z" />
  ),
  unstoppable: <path d="M35 12 20 34h10l-3 18 17-24H34z" />,
  camera: (
    <>
      <path d="M18 24h7l3-5h8l3 5h7v20H18z" />
      <circle cx="32" cy="34" r="6" fill="var(--badge-bg)" />
      <circle cx="32" cy="34" r="3.5" />
    </>
  ),
  'x-link': (
    <path d="M41 16h5L35 29l13 19h-10l-8-11-9 11h-5l12-14-12-18h10l7 10zm-2 29h3L25 19h-3z" />
  ),
  social: (
    <>
      <circle cx="25" cy="25" r="5" />
      <circle cx="40" cy="25" r="5" />
      <path d="M15 44c0-7 4-11 10-11s10 4 10 11zm16 0c1-6 3-10 9-10s9 4 9 10z" />
    </>
  ),
  star: (
    <path d="m32 13 5.6 11.8 12.9 1.6-9.5 8.9 2.5 12.8L32 41.8 20.5 48l2.5-12.8-9.5-8.9 12.9-1.6z" />
  ),
  crown: <path d="M16 44 13 22l10 8 9-14 9 14 10-8-3 22zm1 3h30v4H17z" />,
  // Cámara con flash: Paparazzi
  paparazzi: (
    <>
      <path d="M16 26h7l3-4h12l3 4h7v18H16z" />
      <circle cx="32" cy="35" r="5.5" fill="var(--badge-bg)" />
      <path d="m44 12-4 7h4l-3 6 7-9h-4l3-4z" />
    </>
  ),
  // Corazón con chispas: Influencer de barrio
  influencer: (
    <>
      <path d="M32 47S17 38 17 28a7.5 7.5 0 0 1 15-2 7.5 7.5 0 0 1 15 2c0 10-15 19-15 19z" />
      <path d="M48 14l1.5 3.5L53 19l-3.5 1.5L48 24l-1.5-3.5L43 19l3.5-1.5zM15 15l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" />
    </>
  ),
  // Bocadillos de conversación: Tertuliano
  tertuliano: (
    <>
      <path d="M14 18h24a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H24l-7 6v-6h-3a3 3 0 0 1-3-3V21a3 3 0 0 1 3-3z" />
      <path d="M44 27h5a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-2v5l-6-5h-9a3 3 0 0 1-3-3v-1h12a3 3 0 0 0 3-3z" />
    </>
  ),
  // Silbato de árbitro: Árbitro (votar pruebas de otros)
  arbitro: (
    <>
      <path d="M14 30a9 9 0 1 0 18 0h6l12-6v-6H23a9 9 0 0 0-9 12z" />
      <circle cx="23" cy="30" r="3.5" fill="var(--badge-bg)" />
      <path d="M40 18v-5h4v5z" />
    </>
  ),
  // Moneda: Mecenas (canjeada en Premios)
  mecenas: (
    <>
      <circle cx="32" cy="32" r="14" />
      <path
        d="M34 23h-4v3c-3 .5-5 2.5-5 5 0 3 2.5 4 5.5 4.8 2 .6 2.5 1 2.5 1.8s-1 1.4-2.6 1.4c-1.7 0-3-.7-3.6-2l-3 1.6c.9 1.8 2.6 3 4.2 3.3V45h4v-3c3-.5 5-2.5 5-5.2 0-3-2.5-4-5.4-4.8-2-.5-2.6-1-2.6-1.7s.9-1.3 2.3-1.3c1.4 0 2.4.6 2.9 1.6l3-1.6c-.8-1.6-2.2-2.7-3.3-3z"
        fill="var(--badge-bg)"
      />
    </>
  ),
  // Toro bravo (toro de Osborne)
  toro: (
    <path d="M14 30c3-5 9-6 13-5l3-4 2 4h8c3-1 6-5 8-5 0 3-2 5-4 6 2 2 3 6 2 9h-3l-1 6h-3l-1-5h-9l-2 5h-3l-1-6c-3 0-5-1-6-3l-3 2z" />
  ),
  // Tres croquetas en el plato: Croquetero
  croquetero: (
    <>
      <ellipse cx="32" cy="42" rx="19" ry="5" />
      <rect x="17" y="27" width="12" height="10" rx="5" transform="rotate(-15 23 32)" />
      <rect x="27" y="22" width="12" height="10" rx="5" />
      <rect x="35" y="27" width="12" height="10" rx="5" transform="rotate(15 41 32)" />
    </>
  ),
}

const COLORS: Record<string, [string, string]> = {
  'first-step': ['#16a34a', '#dcfce7'],
  streak: ['#ea580c', '#ffedd5'],
  unstoppable: ['#7c3aed', '#ede9fe'],
  camera: ['#0284c7', '#e0f2fe'],
  'x-link': ['#171717', '#e5e5e5'],
  social: ['#db2777', '#fce7f3'],
  star: ['#ca8a04', '#fef9c3'],
  crown: ['#c2410c', '#fde68a'],
  paparazzi: ['#0f766e', '#ccfbf1'],
  influencer: ['#e11d48', '#ffe4e6'],
  tertuliano: ['#4f46e5', '#e0e7ff'],
  croquetero: ['#a16207', '#fef3c7'],
  arbitro: ['#1f2937', '#fde047'],
  mecenas: ['#a16207', '#fef9c3'],
  toro: ['#0a0a0a', '#fecaca'],
}

export function BadgeIcon({
  icon,
  locked,
  className,
}: {
  icon: string
  locked?: boolean
  className?: string
}) {
  const [fg, bg] = COLORS[icon] ?? ['#57534e', '#f5f5f4']
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn('size-14', locked && 'opacity-35 grayscale', className)}
      style={{ ['--badge-bg' as string]: bg }}
      aria-hidden
    >
      <path d="M32 3 57 17.5v29L32 61 7 46.5v-29z" fill={bg} stroke={fg} strokeWidth="3" />
      <g fill={fg}>{GLYPHS[icon] ?? <circle cx="32" cy="32" r="10" />}</g>
    </svg>
  )
}
