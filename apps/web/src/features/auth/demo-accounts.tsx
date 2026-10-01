import { Shield, UserRound } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Spinner } from '@/components/states'
import { Button } from '@/components/ui/button'
import { DEMO_ACCOUNTS, DEMO_PASSWORD, env } from '@/lib/env'
import { errorMessage } from '@/lib/errors'
import { supabase } from '@/lib/supabase'

/** Acceso rápido con las cuentas demo del seed. Solo se muestra en local (VITE_DEMO_ACCOUNTS). */
export function DemoAccounts() {
  const [pending, setPending] = useState<string | null>(null)
  if (!env.demoAccounts) return null

  async function enter(email: string) {
    setPending(email)
    const { error } = await supabase.auth.signInWithPassword({ email, password: DEMO_PASSWORD })
    setPending(null)
    if (error) toast.error(`${errorMessage(error)} ¿Has cargado el seed? (npm run db:reset)`)
  }

  return (
    <section
      aria-labelledby="demo-title"
      className="grid gap-2 rounded-xl border border-dashed border-primary/50 bg-accent/40 p-3"
    >
      <h2
        id="demo-title"
        className="text-center text-xs font-semibold text-muted-foreground uppercase"
      >
        Cuentas de prueba (solo en local)
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {DEMO_ACCOUNTS.map((a) => {
          const Icon = a.role === 'admin' ? Shield : UserRound
          return (
            <Button
              key={a.email}
              type="button"
              variant={a.role === 'admin' ? 'default' : 'outline'}
              disabled={!!pending}
              onClick={() => enter(a.email)}
            >
              {pending === a.email ? <Spinner /> : <Icon />}
              {a.label}
            </Button>
          )
        })}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {DEMO_ACCOUNTS.map((a) => a.email).join(' · ')} · contraseña <code>{DEMO_PASSWORD}</code>
      </p>
    </section>
  )
}
