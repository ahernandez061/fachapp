import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useThemeStore, type Theme } from '@/stores/theme'

const next: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' }
const labels: Record<Theme, string> = {
  system: 'Tema del sistema',
  light: 'Tema claro',
  dark: 'Tema oscuro',
}

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next[theme])}
      aria-label={`${labels[theme]}. Pulsa para cambiar`}
      title={labels[theme]}
    >
      <Icon className="size-5" />
    </Button>
  )
}
