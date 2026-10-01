import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Logo } from '@/components/logo'

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <Link to="/bienvenida" className="self-center" aria-label="FachApp, inicio">
        <Logo className="text-2xl" />
      </Link>
      <div className="grid gap-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
      {footer && <div className="text-center text-sm text-muted-foreground">{footer}</div>}
    </div>
  )
}
