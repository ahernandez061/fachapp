// Aspecto visual de los premios canjeables. La BD guarda solo el código (rewards.code).

/** Color primario de la app (claro / oscuro) para cada tema. */
export const THEMES: Record<string, { light: string; dark: string; swatch: string }> = {
  tema_rojigualda: {
    light: 'oklch(0.5 0.2 27)',
    dark: 'oklch(0.78 0.16 85)',
    swatch: 'linear-gradient(180deg,#c60b1e 0 25%,#ffc400 25% 75%,#c60b1e 75%)',
  },
  tema_azul_marino: {
    light: 'oklch(0.42 0.12 260)',
    dark: 'oklch(0.72 0.12 250)',
    swatch: '#1e3a8a',
  },
  tema_verde_olivo: {
    light: 'oklch(0.45 0.09 125)',
    dark: 'oklch(0.75 0.12 125)',
    swatch: '#556b2f',
  },
  tema_morado: { light: 'oklch(0.42 0.17 305)', dark: 'oklch(0.74 0.14 305)', swatch: '#6b21a8' },
  tema_oro: {
    light: 'oklch(0.52 0.12 75)',
    dark: 'oklch(0.82 0.14 85)',
    swatch: 'linear-gradient(135deg,#a16207,#facc15,#a16207)',
  },
}

/** Clases del aro alrededor del avatar para cada marco. */
export const FRAMES: Record<string, string> = {
  marco_rojigualda: 'bg-[conic-gradient(#c60b1e_0_25%,#ffc400_25%_75%,#c60b1e_75%)]',
  marco_oro: 'bg-[conic-gradient(#a16207,#facc15,#fde68a,#facc15,#a16207)]',
  marco_plata: 'bg-[conic-gradient(#71717a,#e4e4e7,#a1a1aa,#e4e4e7,#71717a)]',
}

/** Aplica el color del tema equipado (o restaura el de serie si es null). */
export function applyRewardTheme(code: string | null | undefined, dark: boolean) {
  const root = document.documentElement
  const theme = code ? THEMES[code] : undefined
  if (!theme) {
    root.style.removeProperty('--primary')
    root.style.removeProperty('--ring')
    return
  }
  const color = dark ? theme.dark : theme.light
  root.style.setProperty('--primary', color)
  root.style.setProperty('--ring', color)
}
