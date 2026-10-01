import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/lib/errors'
import { isNative } from '@/lib/native'
import { authRedirectUrl, supabase } from '@/lib/supabase'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12s4.3 9.7 9.7 9.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  )
}

export function XIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.3L2.8 2h6.4l4.4 5.9L18.9 2zm-1.1 18h1.7L8.3 3.9H6.5L17.8 20z" />
    </svg>
  )
}

export function OAuthButtons() {
  async function signIn(provider: 'google' | 'x') {
    const native = isNative()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: authRedirectUrl(),
        // En móvil abrimos el navegador del sistema (Google no permite OAuth en WebViews).
        skipBrowserRedirect: native,
        // Para X pedimos solo lo mínimo para identificarte; los permisos de lectura
        // para misiones se piden aparte, con su propio consentimiento.
        scopes: provider === 'x' ? 'users.read tweet.read' : undefined,
      },
    })
    if (error) return toast.error(errorMessage(error))
    if (native && data.url) {
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url: data.url })
    }
  }

  return (
    <div className="grid gap-2">
      <Button variant="outline" onClick={() => signIn('google')}>
        <GoogleIcon /> Continuar con Google
      </Button>
      <Button variant="outline" onClick={() => signIn('x')}>
        <XIcon /> Continuar con X
      </Button>
    </div>
  )
}

export function Divider({ label = 'o' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground uppercase">
      <span className="h-px flex-1 bg-border" />
      {label}
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
