import { Toaster as Sonner, type ToasterProps } from 'sonner'
import { resolveDark, useThemeStore } from '@/stores/theme'

function Toaster(props: ToasterProps) {
  const theme = useThemeStore((s) => s.theme)
  const prefersDark =
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  return (
    <Sonner
      theme={resolveDark(theme, prefersDark) ? 'dark' : 'light'}
      position="top-center"
      richColors
      closeButton
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
