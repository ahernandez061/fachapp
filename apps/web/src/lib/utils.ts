import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Iniciales para avatares: 'Lucía Romero' → 'LR'. */
export function initials(name?: string | null) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  return (parts[0]?.[0] ?? '?').concat(parts[1]?.[0] ?? '').toUpperCase()
}
